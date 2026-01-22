/**
 * IPFS Service
 * Handles file uploads to IPFS and retrieval
 */

import { create } from 'ipfs-core'

let ipfsNode: any = null

export async function getIpfsNode() {
  if (!ipfsNode) {
    ipfsNode = await create({
      repo: 'hideaway-ipfs',
      start: true,
    })
  }
  return ipfsNode
}

/**
 * Upload file to IPFS
 */
export async function uploadToIpfs(file: File): Promise<string> {
  const node = await getIpfsNode()
  const fileBuffer = await file.arrayBuffer()
  const result = await node.add(fileBuffer)
  return result.cid.toString()
}

/**
 * Download file from IPFS
 */
export async function downloadFromIpfs(cid: string): Promise<Uint8Array> {
  const node = await getIpfsNode()
  const chunks: Uint8Array[] = []
  
  for await (const chunk of node.cat(cid)) {
    chunks.push(chunk)
  }
  
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0
  
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }
  
  return result
}
