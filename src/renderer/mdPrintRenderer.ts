import { ModernCellParser } from "@hypersphere/sqlseal/dist/src/cellParser/ModernCellParser";
import { ViewDefinition } from "@hypersphere/sqlseal/dist/src/grammar/parser";
import { RendererConfig, RendererContext } from "@hypersphere/sqlseal/dist/src/renderer/rendererRegistry";
// import { ParseResults } from "@hypersphere/sqlseal/dist/src/cellParser/parseResults";
import { console } from "inspector";
import { getMarkdownTable } from "markdown-table-ts";
import { App, Editor } from "obsidian";
import { mapDataFromHeaders, renderAsString } from "src/utils/materializerUtils";


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

    render(config: ReturnType<typeof this.validateConfig>, el: HTMLElement, { cellParser } : RendererContext) {
        return {
            render: ({ columns, data }: any) => {
                // Check if a id was provided
                if (Object.keys(config).length === 0)
                    throw new Error('The MD-PRINT renderer needs an ID to work.')
        
                // Render the table and save it to the file.
                this.printTable(config, { columns, data }, cellParser)

                // Hide the original code block.
                el.empty()
                el.createDiv({ text: "This codeblock is hidden." })
            },
            error: (error: string) => {
                return createDiv({ text: error, cls: 'sqlseal-error' })
            }
        }
    }

    private printTable(config, { columns, data }: any, cellParser: ModernCellParser) {
        // Get the editor instance
        const editor = this.app.workspace.activeEditor?.editor
        if (!editor)
            throw new Error('No active editor found.')

        // Construct the md table.
        const tab = getMarkdownTable({
            table: {
                head: columns,
                body: mapDataFromHeaders(columns, renderAsString(data, columns, cellParser))
            }
        })

        const regex = new RegExp(`\`\`\`sqlseal\\n[\\s\\S]*?${this.rendererKey} ${config}[\\s\\S]*?\`\`\``, 'gi');
        let match;
        while ((match = regex.exec(editor.getValue())) !== null) {
            // Get the line number of the codeblocks end
            const curLineNumber = editor.getValue().substring(0, match.index + match[0].length).split('\n').length - 1;

            // Generate the region strings            
            const { regionStart, regionEnd } = this.generateRegionStrings(config);

            // Get the old materialized region location
            const { startLine, endLine } = this.getMaterializedTableLocation(editor, curLineNumber, regionStart, regionEnd);

            // Handle the old materialized table
            if (startLine !== -1 && endLine !== -1) {
                // If the new table is the same as the old, don't do anything
                if (this.checkTableUpdate(editor, startLine, endLine, tab)) {
                    console.log('MD-PRINT Renderer: Table is the same, not updating.')
                    return
                }

                // Remove the old content, if present
                this.removeOldMaterializedRegion(editor, startLine, endLine);
            }

            // Save the rendered table to the file
            const newContent = `${regionStart}\n\n${tab}\n${regionEnd}`;
            const currentLineContent = editor.getLine(curLineNumber);
            editor.setLine(curLineNumber, `${currentLineContent}\n\n${newContent}`);

            console.log("MD-PRINT Renderer: Table printed/updated.")
        }
    }
    
    private async removeOldMaterializedRegion(editor: Editor, startLine: number, endLine: number) { 
        // Remove the materialized region if it exists
        if (!(startLine !== -1 && endLine !== -1)) 
            return

        // Remove an empty line after the materialized region, as it gets re-added later on
        if (editor.getLine(endLine + 1).trim() === '')
            endLine += 1

        editor.replaceRange('', { line: startLine, ch: 0 }, { line: endLine + 1, ch: 0 })
    }

    private checkTableUpdate(editor: Editor, startLine: number, endLine: number, newTab: string): boolean { 
        const oldTab = editor.getRange({ line: startLine + 1, ch: 0 }, { line: endLine, ch: 0 })

        return oldTab.trim() == newTab.trim()
    }

    private generateRegionStrings(config: string): { regionStart: string, regionEnd: string } {
        return {
            regionStart: `%% START ${this.rendererKey}: ${config} %%`,
            regionEnd: `%% END ${this.rendererKey}: ${config} %%`
        }
    }

    private getMaterializedTableLocation(editor: Editor, currentLineNumber: number, regionStart: string, regionEnd: string): { startLine: number, endLine: number } {
        const lines = editor.getValue().split('\n')
        let startLine = -1
        let endLine = -1
        
        // Find the start and end lines of the materialized region
        for (let i = currentLineNumber + 1; i < lines.length; i++) {
            if (lines[i].startsWith(regionStart)) {
                startLine = i
                continue
            }

            if (lines[i].startsWith(regionEnd) && startLine !== -1) {
                endLine = i
                break
            }
        }

        return {
            startLine: startLine,
            endLine: endLine
        }
    } 
}