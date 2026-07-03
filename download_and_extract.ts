import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const fileId = '1QljoZrl-rQkZ1CDZKKd_yDiLbROOycYa';
const zipPath = path.join(process.cwd(), 'small.zip');
const extractDir = path.join(process.cwd(), 'extracted_small');

async function downloadGoogleDriveFile(id: string, dest: string) {
  console.log(`Downloading Google Drive file with ID: ${id}...`);
  // Try direct download URL first
  const url = `https://drive.google.com/uc?export=download&id=${id}`;
  
  try {
    // We can use native node fetch to download
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`);
    }
    
    // Check if we got a Google Drive virus scan warning / confirmation page
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      const html = await response.text();
      // Look for confirmation token
      const match = html.match(/confirm=([a-zA-Z0-9_]+)/);
      if (match && match[1]) {
        const confirmToken = match[1];
        console.log(`Found confirmation token: ${confirmToken}. Retrying with confirmation...`);
        const confirmUrl = `https://drive.google.com/uc?export=download&id=${id}&confirm=${confirmToken}`;
        const confirmResponse = await fetch(confirmUrl);
        if (!confirmResponse.ok) {
          throw new Error(`Failed to download with confirmation: ${confirmResponse.statusText}`);
        }
        const buffer = await confirmResponse.arrayBuffer();
        fs.writeFileSync(dest, Buffer.from(buffer));
        console.log(`Download complete: ${dest}`);
        return;
      } else {
        console.log("HTML response without confirmation token. Content:");
        console.log(html.substring(0, 1000));
        throw new Error("Could not find confirmation token in Google Drive response.");
      }
    }
    
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(dest, Buffer.from(buffer));
    console.log(`Download complete: ${dest}`);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
}

async function main() {
  try {
    await downloadGoogleDriveFile(fileId, zipPath);
    
    if (!fs.existsSync(extractDir)) {
      fs.mkdirSync(extractDir, { recursive: true });
    }
    
    console.log(`Extracting to ${extractDir}...`);
    // Use system unzip via child_process
    try {
      execSync(`unzip -o "${zipPath}" -d "${extractDir}"`);
      console.log('Extraction complete.');
    } catch (unzipErr) {
      console.log('Unzip command failed, trying node-based unzip if possible, or listing files...');
      throw unzipErr;
    }
    
    // List extracted files
    const listFiles = (dir: string): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(listFiles(fullPath));
        } else {
          results.push(path.relative(extractDir, fullPath));
        }
      });
      return results;
    };
    
    const files = listFiles(extractDir);
    console.log(`Extracted ${files.length} files:`);
    console.log(files.slice(0, 50).join('\n'));
    if (files.length > 50) {
      console.log(`... and ${files.length - 50} more files`);
    }
    
  } catch (err) {
    console.error('Main process failed:', err);
  }
}

main();
