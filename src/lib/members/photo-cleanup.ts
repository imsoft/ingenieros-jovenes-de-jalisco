// Supabase Storage keeps a placeholder object in folders created from the dashboard.
const FOLDER_PLACEHOLDER = ".emptyFolderPlaceholder"

// Paths in a member's photo folder that no profile uses (uploaded but never saved, or replaced).
// `keepPath` is the photo the profile points to; everything else in the folder can go.
export function getUnusedPhotoPaths(userId: string, fileNames: string[], keepPath: string | null) {
  return fileNames
    .filter((name) => name && name !== FOLDER_PLACEHOLDER)
    .map((name) => `${userId}/${name}`)
    .filter((path) => path !== keepPath)
}
