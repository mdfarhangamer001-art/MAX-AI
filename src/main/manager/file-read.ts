import fs from 'fs/promises'

// Exported directly to read a file with automatic truncation for large files
export async function readFile(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return content.length > 3000 ? content.slice(0, 3000) + '\n...(Truncated)' : content
  } catch (err) {
    return `Error reading file: ${err}`
  }
}
