declare module "vfile" {
    interface DataMap {
        directoryLabel: string;
    }
}
/**
 * Process the HTML for a file tree to create the necessary markup for each file and directory
 * including icons.
 * @param html Inner HTML passed to the `<FileTree>` component.
 * @param directoryLabel The localized label for a directory.
 * @returns The processed HTML for the file tree.
 */
export declare function processFileTree(html: string, directoryLabel: string): string;
export interface Definitions {
    files: Record<string, string>;
    extensions: Record<string, string>;
    partials: Record<string, string>;
}
