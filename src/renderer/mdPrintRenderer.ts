import { RendererConfig } from "@hypersphere/sqlseal";
import { ViewDefinition } from "@hypersphere/sqlseal/dist/src/grammar/parser";
import { getMarkdownTable } from "markdown-table-ts";
import { App, Editor } from "obsidian";
import { mapDataFromHeaders } from "src/utils/mdTableParser";


export class MDPrintRenderer implements RendererConfig {    
    constructor(private readonly app: App) { 
    }
    
    get viewDefinition(): ViewDefinition {
        return {
            name: this.rendererKey,
            argument: 'restLine?',
            singleLine: true
        }
    }

    get rendererKey() {
        return 'md-print'
    }

    validateConfig(config: string) {
        if (!config || !config.trim())
            return {}
        return config
    }

    render(config: ReturnType<typeof this.validateConfig>, el: HTMLElement) {
        return {
            render: ({ columns, data }: any) => {
                // Check if a id was provided
                if (Object.keys(config).length === 0)
                    throw new Error('The MD-PRINT renderer needs an ID to work.')

                console.log("MD-PRINT Rendered")
        
                // Render the table and save it to the file.
                this.printTable(config, { columns, data })

                // Hide the original code block.
                el.empty()
                el.createDiv({ text: "This codeblock is hidden." })
            },
            error: (error: string) => {
                return createDiv({ text: error, cls: 'sqlseal-error' })
            }
        }
    }

    private printTable(config, { columns, data }: any) {
        // Get the editor instance
        const editor = this.app.workspace.activeEditor?.editor
        if (!editor)
            throw new Error('No active editor found.')

        // Construct the md table.
        const tab = getMarkdownTable({
            table: {
                head: columns,
                body: mapDataFromHeaders(columns, data)
            }
        })

        // const regex = new RegExp(`\`\`\`sqlseal\\n[\\s\\S]*?MD-PRINT ${config}[\\s\\S]*?\`\`\``, 'g');
        const regex = new RegExp(`\`\`\`sqlseal\\n[\\s\\S]*?${this.rendererKey} ${config}[\\s\\S]*?\`\`\``, 'gi');
        let match;
        while ((match = regex.exec(editor.getValue())) !== null) {
            // Get the line number of the codeblocks end
            const lineNumber = editor.getValue().substring(0, match.index + match[0].length).split('\n').length - 1;

            // Generate the region strings            
            const { regionStart, regionEnd } = this.generateRegionStrings(config);

            // Remove the old content, if present
            this.checkForExistingMaterializedRegion(editor, lineNumber, regionStart, regionEnd);

            // Save the rendered table to the file
            const newContent = `${regionStart}\n\n${tab}\n${regionEnd}`;
            const currentLineContent = editor.getLine(lineNumber);
            editor.setLine(lineNumber, `${currentLineContent}\n\n${newContent}`);
        }
    }
    
    private async checkForExistingMaterializedRegion(editor: Editor, currentLineNumber: number, regionStart: string, regionEnd: string) { 
        const lines = editor.getValue().split('\n')
        let startLine = -1
        let endLine = -2

        // Find the start and end lines of the materialized region
        for (let i = currentLineNumber + 1; i < lines.length; i++) {
            if (lines[i].includes(regionStart)) {
                startLine = i
            } else if (startLine !== -1 && lines[i].includes(regionEnd)) {
                endLine = i
                // Count until a non-empty line is encountered
                for (let j = i + 1; j < lines.length; j++) {
                    if (lines[j].trim() !== '') {
                        endLine = j - 1
                        break
                    }
                    if (j === lines.length - 1) {
                        endLine = j
                    }
                }
                break
            }
        }

        // Remove the materialized region if it exists
        if (startLine !== -1 && endLine !== -1) {
            editor.replaceRange('', { line: startLine, ch: 0 }, { line: endLine + 1, ch: 0 })
        }
    }

    private generateRegionStrings(config: string) {
        return {
            regionStart: `%% START ${this.rendererKey}: ${config} %%`,
            regionEnd: `%% END ${this.rendererKey}: ${config} %%`
        }
    }
}