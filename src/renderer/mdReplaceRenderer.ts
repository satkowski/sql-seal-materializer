import { RendererConfig } from "@hypersphere/sqlseal";
import { ModernCellParser } from "@hypersphere/sqlseal/dist/src/cellParser/ModernCellParser";
import { ViewDefinition } from "@hypersphere/sqlseal/dist/src/grammar/parser";
import { RendererContext } from "@hypersphere/sqlseal/dist/src/renderer/rendererRegistry";
import { console } from "inspector";
import { getMarkdownTable } from "markdown-table-ts";
import { App, Editor } from "obsidian";
import { mapDataFromHeaders, renderAsString } from "src/utils/materializerUtils";


export class MDReplaceRenderer implements RendererConfig {    
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
        return 'md-replace'
    }

    validateConfig(config: string) {
        if (!config || !config.trim())
            return {}
        return config
    }


    render(config: ReturnType<typeof this.validateConfig>, el: HTMLElement, { cellParser, sourcePath }: RendererContext) {
        return {
            render: ({ columns, data }: any) => {
                // Check if a id was provided
                if (Object.keys(config).length === 0)
                    throw new Error('The MD-REPLACE renderer needs an ID to work.')

                el.empty()

                // Create the parent
                const parent = el.createDiv({
                    cls: ['sqlseal-replace-parent'],
                })
                
                // Create the table and its div
                const container = parent.createDiv({
                    cls: ['sqlseal-table-container', 'sqlseal-replace-preview']
                })
                const table = this.createRenderedTable(container, cellParser, columns, data)

                // Create the blocking rect
                const blocker = parent.createDiv({
                    cls: ['sqlseal-replace-blocker']
                })

                // Create the interaction div
                const front = parent.createDiv({
                    cls: ['sqlseal-replace-front']
                });

                front.createDiv({
                    text: "Disclaimer: Clicking the following button will override this codeblock permanently!",
                    cls: ['sqlseal-replace-disclaimer']
                })

                // Add a button to the front that the user can interact with
                const button = front.createEl("button", {
                    text: "Replace!",
                    cls: ['sqlseal-replace-button']
                });

                button.addEventListener("click", () => {
                    this.printTable(config, { columns, data }, { cellParser, sourcePath })
                });

                // Set the parent height based on the table height
                const style = getComputedStyle(table);
                const marginTop = parseFloat(style.marginTop) || 0;
                const marginBottom = parseFloat(style.marginBottom) || 0;
                parent.style.height = `${table.offsetHeight + marginTop + marginBottom}px`;
            },
            error: (error: string) => {
                return createDiv({ text: error, cls: 'sqlseal-error' })
            }
        }
    }

    private createRenderedTable(container: HTMLDivElement, cellParser: ModernCellParser, columns: string[], data: any[]): HTMLTableElement {
        let tableClasses = ['sqlseal']

        const table = container.createEl("table", {
            cls: tableClasses
        })

        // HEADER
        const header = table.createEl("thead").createEl("tr")
        columns.forEach((c: string) => {
            header.createEl("th", { text: c })
        })

        const body = table.createEl("tbody")
        data.forEach((d: any) => {
            const row = body.createEl("tr")
            columns.forEach((c: any) => {
                row.createEl("td", { text: cellParser.render(d[c]) as string })                        

            })
        })

        return table
    }

    private printTable(config, { columns, data }: any, { cellParser, sourcePath } : RendererContext) {
        // Get the editor instance
        const editor = this.app.workspace.activeEditor?.editor
        if (!editor)
            throw new Error('No active editor found.')

        // Check if the file that made that initiated this call is also the files that is currently open and would therfore be updated.
        const path = this.app.workspace.activeEditor?.file?.path
        if (!path || path !== sourcePath) {
            return
        }

        // Construct the md table.
        const tab = getMarkdownTable({
            table: {
                head: columns,
                body: mapDataFromHeaders(columns, renderAsString(data, columns, cellParser))
            }
        })
        
        const regex = new RegExp(`\`\`\`sqlseal\\n*${this.rendererKey}\\s${config}[\\s\\S]*?\`\`\``, 'gi');
        let match;
        while ((match = regex.exec(editor.getValue())) !== null) {
            const startLine = editor.getValue().substring(0, match.index).split('\n').length - 1;
            const endLine = editor.getValue().substring(0, match.index + match[0].length).split('\n').length;

            editor.replaceRange(`${tab}\n`, { line: startLine, ch: 0 }, { line: endLine, ch: 0 });
        }
    }
}