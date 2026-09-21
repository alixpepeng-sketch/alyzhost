import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

// Urutan pencarian ffmpeg: FFMPEG_PATH, paket ffmpeg-static, lalu ffmpeg di PATH sistem.
async function resolveFfmpeg() {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  try {
    const mod = await import('ffmpeg-static');
    if (mod.default) return mod.default;
  } catch {
    /* paket opsional tidak terpasang */
  }
  return 'ffmpeg';
}

function run(bin, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr = (stderr + chunk.toString()).slice(-600);
    });
    const timer = setTimeout(() => child.kill('SIGKILL'), 90_000);
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err); // err.code === 'ENOENT' kalau ffmpeg tidak terpasang
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(stderr || `ffmpeg berhenti dengan kode ${code}`));
    });
  });
}

// Tulis buffer ke file sementara, jalankan `ffmpeg -i input <args> output`,
// baca hasilnya sebagai buffer, lalu hapus file sementara.
export async function convertBuffer(buffer, { inputExt, outputExt, args }) {
  const bin = await resolveFfmpeg();
  const id = randomUUID();
  const input = path.join(os.tmpdir(), `alyz-${id}.${inputExt}`);
  const output = path.join(os.tmpdir(), `alyz-${id}.${outputExt}`);

  await fs.writeFile(input, buffer);
  try {
    await run(bin, ['-y', '-i', input, ...args, output]);
    return await fs.readFile(output);
  } finally {
    await Promise.allSettled([fs.rm(input, { force: true }), fs.rm(output, { force: true })]);
  }
}
