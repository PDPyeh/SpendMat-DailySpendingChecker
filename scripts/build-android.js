const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const androidDir = path.join(rootDir, 'android');
const androidAssetsDir = path.join(androidDir, 'app', 'src', 'main', 'assets');
const androidResDir = path.join(androidDir, 'app', 'src', 'main', 'res');

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function syncAssets() {
  console.log('Syncing SpendMat web assets and offline fonts to Android project...');
  fs.rmSync(androidAssetsDir, { recursive: true, force: true });

  // Mirror exact relative paths so index.html works identically on Electron and Android
  copyDirRecursive(
    path.join(rootDir, 'src', 'renderer'),
    path.join(androidAssetsDir, 'src', 'renderer')
  );

  const fontPackages = [
    { pkg: 'silkscreen', css: ['400.css', '700.css'] },
    { pkg: 'plus-jakarta-sans', css: ['400.css', '500.css', '600.css', '700.css', '800.css'] },
    { pkg: 'ibm-plex-mono', css: ['500.css', '600.css', '700.css'] }
  ];

  for (const { pkg, css } of fontPackages) {
    const srcPkg = path.join(rootDir, 'node_modules', '@fontsource', pkg);
    const destPkg = path.join(androidAssetsDir, 'node_modules', '@fontsource', pkg);
    fs.mkdirSync(path.join(destPkg, 'files'), { recursive: true });

    const neededFiles = new Set();
    for (const cssFile of css) {
      const cssSrc = path.join(srcPkg, cssFile);
      const cssText = fs.readFileSync(cssSrc, 'utf8');
      fs.copyFileSync(cssSrc, path.join(destPkg, cssFile));
      const matches = cssText.matchAll(/url\(\.\/files\/([^)]+)\)/g);
      for (const m of matches) {
        neededFiles.add(m[1]);
      }
    }

    for (const fontFile of neededFiles) {
      const fileSrc = path.join(srcPkg, 'files', fontFile);
      if (fs.existsSync(fileSrc)) {
        fs.copyFileSync(fileSrc, path.join(destPkg, 'files', fontFile));
      }
    }
  }

  // Copy launcher icon
  const mipmapDir = path.join(androidResDir, 'mipmap-xxhdpi');
  fs.mkdirSync(mipmapDir, { recursive: true });
  const iconSrc = path.join(rootDir, 'assets', 'icon.png');
  fs.copyFileSync(iconSrc, path.join(mipmapDir, 'ic_launcher.png'));
  fs.copyFileSync(iconSrc, path.join(mipmapDir, 'ic_launcher_round.png'));
}

function findGradleBinary() {
  const localWrapper = path.join(androidDir, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
  if (fs.existsSync(localWrapper)) {
    return localWrapper;
  }
  const userProfile = process.env.USERPROFILE || process.env.HOME || '';
  const distsDir = path.join(userProfile, '.gradle', 'wrapper', 'dists', 'gradle-8.13-bin');
  if (fs.existsSync(distsDir)) {
    for (const sub of fs.readdirSync(distsDir)) {
      const candidate = path.join(distsDir, sub, 'gradle-8.13', 'bin', process.platform === 'win32' ? 'gradle.bat' : 'gradle');
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }
  return process.platform === 'win32' ? 'gradle.bat' : 'gradle';
}

function findJava21Home() {
  const candidates = [
    'C:\\Program Files\\Java\\jdk-21',
    'C:\\Program Files\\Android\\Android Studio\\jbr',
    process.env.JAVA_HOME
  ].filter(Boolean);
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'bin', 'java.exe'))) {
      return dir;
    }
  }
  return process.env.JAVA_HOME;
}

function runGradleBuild() {
  const gradleBin = findGradleBinary();
  const javaHome = findJava21Home();
  const env = { ...process.env };
  if (javaHome) {
    env.JAVA_HOME = javaHome;
    env.PATH = `${path.join(javaHome, 'bin')}${path.delimiter}${env.PATH || ''}`;
  }
  const androidSdk = path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk');
  if (!env.ANDROID_HOME && fs.existsSync(androidSdk)) {
    env.ANDROID_HOME = androidSdk;
  }

  console.log(`Building Android APK using ${gradleBin} (JAVA_HOME=${env.JAVA_HOME || 'default'})...`);
  execFileSync(gradleBin, ['assembleDebug', '--no-daemon'], {
    cwd: androidDir,
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  const builtApk = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
  const distDir = path.join(rootDir, 'dist');
  fs.mkdirSync(distDir, { recursive: true });
  const outApk = path.join(distDir, 'SpendMat-android.apk');
  fs.copyFileSync(builtApk, outApk);
  const sizeMb = (fs.statSync(outApk).size / (1024 * 1024)).toFixed(2);
  console.log(`\nAndroid APK ready: ${outApk} (${sizeMb} MB)`);
}

syncAssets();
runGradleBuild();
