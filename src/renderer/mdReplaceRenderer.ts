import { RendererConfig } from "@hypersphere/sqlseal";
import { ViewDefinition } from "@hypersphere/sqlseal/dist/src/grammar/parser";
import { getMarkdownTable } from "markdown-table-ts";
import { App, Editor } from "obsidian";
import { mapDataFromHeaders } from "src/utils/materializerUtils";


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
        return {}
    }


    render(config: ReturnType<typeof this.validateConfig>, el: HTMLElement) {
        return {
            render: ({ columns, data }: any) => {
                // Get the editor instance
                const editor: Editor = this.app.workspace.activeEditor?.editor
                if (!editor)
                    throw new Error('No active editor found.')

                // Check if a id was provided
                if (Object.keys(config).length === 0)
                    throw new Error('The MD-REPLACE renderer needs an ID to work.')

                // Construct the md table
                const tab = getMarkdownTable({
                    table: {
                        head: columns,
                        body: mapDataFromHeaders(columns, data)
                    }
                })

                const regex = new RegExp(`\`\`\`sqlseal\\n[\\s\\S]*?${this.rendererKey} ${config}[\\s\\S]*?\`\`\``, 'gi');
                let match;
                while ((match = regex.exec(editor.getValue())) !== null) {
                    // Get the line number of the codeblocks end
                    const startLine = match.index
                    const endLine = editor.getValue().substring(0, match.index + match[0].length).split('\n').length - 1;
        
                    // Save the rendered table to the file
                    const newContent = `${tab}\n`;
                    
                    // Replace the codeblock by the rendered table.
                    editor.replaceRange(newContent, { line: startLine, ch: 0 }, { line: endLine + 1, ch: 0 })
                }
            },
            error: (error: string) => {
                return createDiv({ text: error, cls: 'sqlseal-error' })
            }
        }
    }

    private generateRegionStrings(config: string) {
        return {
            regionStart: `%% START ${this.rendererKey}: ${config} %%`,
            regionEnd: `%% END ${this.rendererKey}: ${config} %%`
        }
    }
}