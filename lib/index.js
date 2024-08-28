"use strict";
// Source: https://github.com/withastro/starlight/blob/main/packages/starlight/user-components/rehype-file-tree.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.processFileTree = processFileTree;
const hastscript_1 = require("hastscript");
const hast_util_select_1 = require("hast-util-select");
const hast_util_from_html_1 = require("hast-util-from-html");
const hast_util_to_string_1 = require("hast-util-to-string");
const rehype_1 = require("rehype");
const unist_util_visit_1 = require("unist-util-visit");
const Icons_1 = require("./Icons");
const file_tree_icons_1 = require("./file-tree-icons");
const folderIcon = makeSVGIcon(Icons_1.Icons["seti:folder"]);
const defaultFileIcon = makeSVGIcon(Icons_1.Icons["seti:default"]);
/**
 * Process the HTML for a file tree to create the necessary markup for each file and directory
 * including icons.
 * @param html Inner HTML passed to the `<FileTree>` component.
 * @param directoryLabel The localized label for a directory.
 * @returns The processed HTML for the file tree.
 */
function processFileTree(html, directoryLabel) {
    const file = fileTreeProcessor.processSync({
        data: { directoryLabel },
        value: html,
    });
    return file.toString();
}
/** Rehype processor to extract file tree data and turn each entry into its associated markup. */
const fileTreeProcessor = (0, rehype_1.rehype)()
    .data("settings", { fragment: true })
    .use(function fileTree() {
    return (tree, file) => {
        const { directoryLabel } = file.data;
        validateFileTree(tree);
        (0, unist_util_visit_1.visit)(tree, "element", (node) => {
            // Strip nodes that only contain newlines.
            node.children = node.children.filter((child) => child.type === "comment" ||
                child.type !== "text" ||
                !/^\n+$/.test(child.value));
            // Skip over non-list items.
            if (node.tagName !== "li")
                return unist_util_visit_1.CONTINUE;
            const [firstChild, ...otherChildren] = node.children;
            // Keep track of comments associated with the current file or directory.
            const comment = [];
            // Extract text comment that follows the file name, e.g. `README.md This is a comment`
            if ((firstChild === null || firstChild === void 0 ? void 0 : firstChild.type) === "text") {
                const [filename, ...fragments] = firstChild.value.split(" ");
                firstChild.value = filename || "";
                const textComment = fragments.join(" ").trim();
                if (textComment.length > 0) {
                    comment.push(fragments.join(" "));
                }
            }
            // Comments may not always be entirely part of the first child text node,
            // e.g. `README.md This is an __important__ comment` where the `__important__` and `comment`
            // nodes would also be children of the list item node.
            const subTreeIndex = otherChildren.findIndex((child) => child.type === "element" && child.tagName === "ul");
            const commentNodes = subTreeIndex > -1
                ? otherChildren.slice(0, subTreeIndex)
                : [...otherChildren];
            otherChildren.splice(0, subTreeIndex > -1 ? subTreeIndex : otherChildren.length);
            comment.push(...commentNodes);
            const firstChildTextContent = firstChild ? (0, hast_util_to_string_1.toString)(firstChild) : "";
            // Decide a node is a directory if it ends in a `/` or contains another list.
            const isDirectory = /\/\s*$/.test(firstChildTextContent) ||
                otherChildren.some((child) => child.type === "element" && child.tagName === "ul");
            // A placeholder is a node that only contains 3 dots or an ellipsis.
            const isPlaceholder = /^\s*(\.{3}|…)\s*$/.test(firstChildTextContent);
            // A node is highlighted if its first child is bold text, e.g. `**README.md**`.
            const isHighlighted = (firstChild === null || firstChild === void 0 ? void 0 : firstChild.type) === "element" && firstChild.tagName === "strong";
            // Create an icon for the file or directory (placeholder do not have icons).
            const icon = (0, hastscript_1.h)("span", isDirectory ? folderIcon : getFileIcon(firstChildTextContent));
            if (isDirectory) {
                // Add a screen reader only label for directories before the icon so that it is announced
                // as such before reading the directory name.
                icon.children.unshift((0, hastscript_1.h)("span", { class: "sr-only" }, directoryLabel));
            }
            // Add classes and data attributes to the list item node.
            node.properties.class = isDirectory ? "directory" : "file";
            if (isPlaceholder)
                node.properties.class += " empty";
            // Create the tree entry node that contains the icon, file name and comment which will end up
            // as the list item’s children.
            const treeEntryChildren = [
                (0, hastscript_1.h)("span", { class: isHighlighted ? "highlight" : "" }, [
                    isPlaceholder ? null : icon,
                    firstChild,
                ]),
            ];
            if (comment.length > 0) {
                treeEntryChildren.push(makeText(" "), (0, hastscript_1.h)("span", { class: "comment" }, ...comment));
            }
            const treeEntry = (0, hastscript_1.h)("span", { class: "tree-entry" }, ...treeEntryChildren);
            if (isDirectory) {
                const hasContents = otherChildren.length > 0;
                node.children = [
                    (0, hastscript_1.h)("details", { open: hasContents }, [
                        (0, hastscript_1.h)("summary", treeEntry),
                        ...(hasContents ? otherChildren : [(0, hastscript_1.h)("ul", (0, hastscript_1.h)("li", "…"))]),
                    ]),
                ];
                // Continue down the tree.
                return unist_util_visit_1.CONTINUE;
            }
            node.children = [treeEntry, ...otherChildren];
            // Files can’t contain further files or directories, so skip iterating children.
            return unist_util_visit_1.SKIP;
        });
    };
});
/** Make a text node with the pass string as its contents. */
function makeText(value = "") {
    return { type: "text", value };
}
/** Make a node containing an SVG icon from the passed HTML string. */
function makeSVGIcon(svgString) {
    return (0, hastscript_1.s)("svg", {
        width: 16,
        height: 16,
        class: "tree-icon",
        "aria-hidden": "true",
        viewBox: "0 0 24 24",
    }, (0, hast_util_from_html_1.fromHtml)(svgString, { fragment: true }));
}
/** Return the icon for a file based on its file name. */
function getFileIcon(fileName) {
    const name = getFileIconName(fileName);
    if (!name)
        return defaultFileIcon;
    if (name in Icons_1.Icons) {
        const path = Icons_1.Icons[name];
        return makeSVGIcon(path);
    }
    return defaultFileIcon;
}
/** Return the icon name for a file based on its file name. */
function getFileIconName(fileName) {
    let icon = file_tree_icons_1.definitions.files[fileName];
    if (icon)
        return icon;
    icon = getFileIconTypeFromExtension(fileName);
    if (icon)
        return icon;
    for (const [partial, partialIcon] of Object.entries(file_tree_icons_1.definitions.partials)) {
        if (fileName.includes(partial))
            return partialIcon;
    }
    return icon;
}
/**
 * Get an icon from a file name based on its extension.
 * Note that an extension in Seti is everything after a dot, so `README.md` would be `.md` and
 * `name.with.dots` will try to look for an icon for `.with.dots` and then `.dots` if the first one
 * is not found.
 */
function getFileIconTypeFromExtension(fileName) {
    const firstDotIndex = fileName.indexOf(".");
    if (firstDotIndex === -1)
        return;
    let extension = fileName.slice(firstDotIndex);
    while (extension !== "") {
        const icon = file_tree_icons_1.definitions.extensions[extension];
        if (icon)
            return icon;
        const nextDotIndex = extension.indexOf(".", 1);
        if (nextDotIndex === -1)
            return;
        extension = extension.slice(nextDotIndex);
    }
    return;
}
/** Validate that the user provided HTML for a file tree is valid. */
function validateFileTree(tree) {
    const rootElements = tree.children.filter(isElementNode);
    const [rootElement] = rootElements;
    if (rootElements.length === 0) {
        throwFileTreeValidationError("The `<FileTree>` component expects its content to be a single unordered list but found no child elements.");
    }
    if (rootElements.length !== 1) {
        throwFileTreeValidationError(`The \`<FileTree>\` component expects its content to be a single unordered list but found multiple child elements: ${rootElements
            .map((element) => `\`<${element.tagName}>\``)
            .join(" - ")}.`);
    }
    if (!rootElement || rootElement.tagName !== "ul") {
        throwFileTreeValidationError(`The \`<FileTree>\` component expects its content to be an unordered list but found the following element: \`<${rootElement === null || rootElement === void 0 ? void 0 : rootElement.tagName}>\`.`);
    }
    const listItemElement = (0, hast_util_select_1.select)("li", rootElement);
    if (!listItemElement) {
        throwFileTreeValidationError("The `<FileTree>` component expects its content to be an unordered list with at least one list item.");
    }
}
function isElementNode(node) {
    return node.type === "element";
}
/** Throw a validation error for a file tree linking to the documentation. */
function throwFileTreeValidationError(message) {
    throw new Error(message);
}
