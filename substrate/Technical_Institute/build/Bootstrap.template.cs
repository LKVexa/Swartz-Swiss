using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;
using System.Windows.Forms;

internal static class Program
{
    private const string Version = "__VERSION__";
    private const string ExpectedPayloadSha256 = "__PAYLOAD_SHA__";

    [STAThread]
    private static int Main(string[] args)
    {
        string logPath = null;
        try
        {
            string applicationRoot = Path.GetFullPath(AppDomain.CurrentDomain.BaseDirectory);
            string local = Environment.GetEnvironmentVariable("JA21_PORTABLE_ROOT");
            if (String.IsNullOrWhiteSpace(local)) local = Path.Combine(applicationRoot, "portable-runtime");
            local = Path.GetFullPath(local);
            if (!IsWithin(applicationRoot, local) && Environment.GetEnvironmentVariable("JA21_ALLOW_EXTERNAL_PORTABLE_ROOT") != "1")
                throw new InvalidOperationException("Use a workspace beside this executable or explicitly set JA21_ALLOW_EXTERNAL_PORTABLE_ROOT=1.");
            AssertNoReparsePoints(local);

            string logRoot = Path.Combine(local, "DF-VM-Technical-Institute", "logs");
            AssertNoReparsePoints(logRoot);
            Directory.CreateDirectory(logRoot);
            logPath = Path.Combine(logRoot, "bootstrap-" + DateTime.Now.ToString("yyyyMMdd-HHmmss-fff") + ".log");
            Log(logPath, "Bootstrap v" + Version + " starting.");

            byte[] payload = DecodePayload();
            string actualHash = Sha256Hex(payload);
            Log(logPath, "Embedded payload SHA-256: " + actualHash);
            if (!String.Equals(actualHash, ExpectedPayloadSha256, StringComparison.OrdinalIgnoreCase))
                throw new InvalidDataException("Embedded payload SHA-256 mismatch. Expected " + ExpectedPayloadSha256 + " but found " + actualHash + ".");

            string baseDir = Path.Combine(local, "DF-VM-Technical-Institute", Version, actualHash);
            AssertNoReparsePoints(baseDir);
            string installDir = Path.Combine(baseDir, "app");
            string marker = Path.Combine(baseDir, "payload.sha256");
            string[] required = new string[] {
                "index.html",
                Path.Combine("assets", "styles.css"),
                Path.Combine("assets", "data.js"),
                Path.Combine("assets", "site.js")
            };

            if (!CacheIsValid(installDir, marker, actualHash, required))
            {
                Log(logPath, "Cache missing or stale; extracting embedded institute.");
                if (Directory.Exists(installDir)) throw new InvalidDataException("Existing cached institute failed validation. Preserve it and choose another workspace before rebuilding.");
                string stagingParent = Path.Combine(local, "DF-VM-Technical-Institute", ".staging-" + Version + "-" + Guid.NewGuid().ToString("N"));
                string stagingDir = Path.Combine(stagingParent, "app");
                AssertNoReparsePoints(stagingDir);
                Directory.CreateDirectory(stagingDir);
                ExtractZipSafely(payload, stagingDir);
                ValidateRequired(stagingDir, required);

                Directory.CreateDirectory(baseDir);
                Directory.Move(stagingDir, installDir);
                File.WriteAllText(marker, actualHash, Encoding.ASCII);
                // The successfully moved staging parent is empty. Never recursively remove cache data.
                Directory.Delete(stagingParent, false);
                Log(logPath, "Installed validated payload to " + installDir);
            }
            else
            {
                Log(logPath, "Validated cached payload at " + installDir);
            }

            string index = Path.Combine(installDir, "index.html");
            bool fullscreen = HasArg(args, "--fullscreen");
            LaunchInstitute(index, fullscreen, logPath);
            Log(logPath, "Launch request completed.");
            return 0;
        }
        catch (Exception ex)
        {
            try { if (!String.IsNullOrEmpty(logPath)) Log(logPath, "ERROR " + ex.ToString()); } catch { }
            string message = "DF VM Technical Institute could not start.\r\n\r\n" + ex.Message;
            if (!String.IsNullOrEmpty(logPath)) message += "\r\n\r\nDiagnostic log:\r\n" + logPath;
            MessageBox.Show(message, "DF VM Technical Institute - Launch Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        }
    }

    private static byte[] DecodePayload()
    {
        string base64 = String.Concat(new string[] {
__BASE64_CHUNKS__
        });
        return Convert.FromBase64String(base64);
    }

    private static bool CacheIsValid(string installDir, string marker, string expectedHash, string[] required)
    {
        if (!Directory.Exists(installDir) || !File.Exists(marker)) return false;
        AssertNoReparsePoints(installDir);
        AssertNoReparsePoints(marker);
        string cached = File.ReadAllText(marker).Trim();
        if (!String.Equals(cached, expectedHash, StringComparison.OrdinalIgnoreCase)) return false;
        for (int i = 0; i < required.Length; i++)
            if (!File.Exists(Path.Combine(installDir, required[i]))) return false;
        // A marker alone does not authenticate mutable cache files.
        using (MemoryStream memory = new MemoryStream(DecodePayload(), false))
        using (ZipArchive archive = new ZipArchive(memory, ZipArchiveMode.Read, false))
            foreach (ZipArchiveEntry entry in archive.Entries) {
                if (String.IsNullOrEmpty(entry.Name)) continue;
                string path = Path.GetFullPath(Path.Combine(installDir, entry.FullName.Replace('/', Path.DirectorySeparatorChar)));
                if (!IsWithin(installDir, path)) return false;
                AssertNoReparsePoints(path);
                if (!File.Exists(path) || new FileInfo(path).Length != entry.Length) return false;
                using (Stream archived = entry.Open())
                using (FileStream cachedFile = File.OpenRead(path))
                using (SHA256 sha = SHA256.Create())
                    if (!String.Equals(Convert.ToBase64String(sha.ComputeHash(archived)), Convert.ToBase64String(sha.ComputeHash(cachedFile)), StringComparison.Ordinal)) return false;
            }
        return true;
    }

    private static void ValidateRequired(string root, string[] required)
    {
        for (int i = 0; i < required.Length; i++)
        {
            string p = Path.Combine(root, required[i]);
            if (!File.Exists(p)) throw new InvalidDataException("Payload validation failed; required file missing: " + required[i]);
        }
    }

    private static void ExtractZipSafely(byte[] payload, string destination)
    {
        string root = Path.GetFullPath(destination);
        if (!root.EndsWith(Path.DirectorySeparatorChar.ToString())) root += Path.DirectorySeparatorChar;

        using (MemoryStream ms = new MemoryStream(payload, false))
        using (ZipArchive archive = new ZipArchive(ms, ZipArchiveMode.Read, false))
        {
            long total = 0;
            HashSet<string> names = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (ZipArchiveEntry entry in archive.Entries)
            {
                if (Path.IsPathRooted(entry.FullName) || entry.FullName.IndexOf(':') >= 0) throw new InvalidDataException("Blocked rooted or alternate-stream archive entry.");
                total += entry.Length;
                if (archive.Entries.Count > 10000 || entry.Length > 67108864 || total > 268435456) throw new InvalidDataException("Embedded payload exceeds extraction budget.");
                string outPath = Path.GetFullPath(Path.Combine(destination, entry.FullName.Replace('/', Path.DirectorySeparatorChar)));
                if (!outPath.StartsWith(root, StringComparison.OrdinalIgnoreCase))
                    throw new InvalidDataException("Blocked unsafe archive path: " + entry.FullName);
                if (!names.Add(outPath)) throw new InvalidDataException("Duplicate archive destination: " + entry.FullName);
                AssertNoReparsePoints(outPath);

                if (String.IsNullOrEmpty(entry.Name))
                {
                    Directory.CreateDirectory(outPath);
                    continue;
                }

                string parent = Path.GetDirectoryName(outPath);
                if (!String.IsNullOrEmpty(parent)) Directory.CreateDirectory(parent);
                using (Stream input = entry.Open())
                using (FileStream output = new FileStream(outPath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
                    input.CopyTo(output);
            }
        }
    }

    private static void LaunchInstitute(string indexPath, bool fullscreen, string logPath)
    {
        Uri indexUri = new Uri(indexPath);
        string browser = FindBrowser();
        if (!String.IsNullOrEmpty(browser))
        {
            string args = "--app=\"" + indexUri.AbsoluteUri + "\" --no-first-run --no-default-browser-check --disable-extensions " + (fullscreen ? "--start-fullscreen" : "--start-maximized");
            Log(logPath, "Starting browser: " + browser + " " + args);
            ProcessStartInfo psi = new ProcessStartInfo(browser, args);
            psi.UseShellExecute = false;
            Process.Start(psi);
            return;
        }

        Log(logPath, "No Edge/Chrome installation found; using Windows default file association.");
        ProcessStartInfo fallback = new ProcessStartInfo(indexPath);
        fallback.UseShellExecute = true;
        Process.Start(fallback);
    }

    private static string FindBrowser()
    {
        List<string> candidates = new List<string>();
        AddBrowserCandidate(candidates, Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), Path.Combine("Microsoft", "Edge", "Application", "msedge.exe"));
        AddBrowserCandidate(candidates, Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), Path.Combine("Microsoft", "Edge", "Application", "msedge.exe"));
        AddBrowserCandidate(candidates, Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), Path.Combine("Google", "Chrome", "Application", "chrome.exe"));
        AddBrowserCandidate(candidates, Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), Path.Combine("Google", "Chrome", "Application", "chrome.exe"));
        return candidates.Count > 0 ? candidates[0] : null;
    }

    private static void AddBrowserCandidate(List<string> list, string root, string relative)
    {
        if (String.IsNullOrWhiteSpace(root)) return;
        string p = Path.Combine(root, relative);
        if (File.Exists(p) && !list.Contains(p)) list.Add(p);
    }

    private static bool HasArg(string[] args, string expected)
    {
        if (args == null) return false;
        for (int i = 0; i < args.Length; i++)
            if (String.Equals(args[i], expected, StringComparison.OrdinalIgnoreCase)) return true;
        return false;
    }

    private static string Sha256Hex(byte[] bytes)
    {
        using (SHA256 sha = SHA256.Create())
        {
            byte[] hash = sha.ComputeHash(bytes);
            StringBuilder sb = new StringBuilder(hash.Length * 2);
            for (int i = 0; i < hash.Length; i++) sb.Append(hash[i].ToString("x2"));
            return sb.ToString();
        }
    }

    private static bool IsWithin(string root, string path)
    {
        return Path.GetFullPath(path).StartsWith(Path.GetFullPath(root).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase);
    }

    private static void AssertNoReparsePoints(string path)
    {
        string probe = Path.GetFullPath(path);
        while (!String.IsNullOrEmpty(probe)) {
            FileAttributes attributes;
            try { attributes = File.GetAttributes(probe); }
            catch (FileNotFoundException) { attributes = 0; }
            catch (DirectoryNotFoundException) { attributes = 0; }
            if ((attributes & FileAttributes.ReparsePoint) != 0)
                throw new InvalidDataException("Portable paths cannot traverse a junction or symbolic link: " + probe);
            string parent = Path.GetDirectoryName(probe);
            if (parent == probe) break;
            probe = parent;
        }
    }

    private static void Log(string path, string message)
    {
        File.AppendAllText(path, DateTime.Now.ToString("o") + " " + message + Environment.NewLine, Encoding.UTF8);
    }
}
