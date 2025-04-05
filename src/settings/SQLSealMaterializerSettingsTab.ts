import { App, PluginSettingTab, Setting, Plugin } from 'obsidian';

export interface SQLSealMaterializerSettings {
    imgSize: number;
    checkboxType: 'unicode' | 'html' | 'markdown';
}

export const DEFAULT_SETTINGS: SQLSealMaterializerSettings = {
    imgSize: 200,
    checkboxType: 'markdown'
}

export class SQLSealMaterializerSettingsTab extends PluginSettingTab {
    plugin: Plugin;
    settings: SQLSealMaterializerSettings;
    private onChangeFns: Array<(setting: SQLSealMaterializerSettings) => void> = []

    constructor(app: App, plugin: Plugin, settings: SQLSealMaterializerSettings) {
        super(app, plugin);
        this.plugin = plugin;
        this.settings = settings;
    }
    
    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'SQLSeal Materializer Settings' });

        new Setting(containerEl)
            .setName("Default Image Size")
            .setDesc("The default size of images if materialized from the 'img' custom column type.")
            .addText(text => text
                .setPlaceholder("number")
                .setValue(this.settings.imgSize + '')
                .onChange(async (value) => {
                    this.settings.imgSize = parseInt(value, 10)
                    if (!value) {
                        this.settings.imgSize = DEFAULT_SETTINGS.imgSize
                    }
                    await this.plugin.saveData(this.settings);
                    this.callChanges();
                })
            );

        new Setting(containerEl)
            .setName('Checkbox Type')
            .setDesc("The type the checkboxes should be rendered at from the 'checkbox' custom column type.")
            .addDropdown(dropdown => dropdown
                .addOption('unicode', 'Unicode')
                .addOption('html', 'HTML Input')
                .addOption('markdown', 'Markdown')
                .setValue(this.settings.checkboxType)
                .onChange(async (value) => {
                    this.settings.checkboxType = value as 'unicode' | 'html' | 'markdown';
                    if (!value) {
                        this.settings.checkboxType = DEFAULT_SETTINGS.checkboxType
                    }
                    await this.plugin.saveData(this.settings);
                    this.callChanges();
                })
            );
    }

    private callChanges() {
        this.onChangeFns.forEach(f => f(this.settings))
    }

    onChange(fn: (settings: SQLSealMaterializerSettings) => void) {
        this.onChangeFns.push(fn)
    }
}