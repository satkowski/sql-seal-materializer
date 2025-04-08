import { Plugin } from "obsidian";
import { MDPrintRenderer } from "./renderer/mdPrintRenderer";
import { MDReplaceRenderer } from "./renderer/mdReplaceRenderer";
import { pluginApi } from "@vanakat/plugin-api";
import { SQLSealRegisterApi } from "@hypersphere/sqlseal";
import { DEFAULT_SETTINGS, SQLSealMaterializerSettings, SQLSealMaterializerSettingsTab } from "./settings/SQLSealMaterializerSettingsTab";

export default class SQLSealMaterializer extends Plugin {
	private static _settings: SQLSealMaterializerSettings;

    static get settings(): SQLSealMaterializerSettings {
        return SQLSealMaterializer._settings;
    }

    async onload() {
		await this.loadSettings();
		const settingsTab = new SQLSealMaterializerSettingsTab(this.app, this, SQLSealMaterializer._settings)
		this.addSettingTab(settingsTab);

        this.registerWithSQLSeal();
    }

    registerWithSQLSeal() {
        const api = pluginApi('sqlseal') as SQLSealRegisterApi
        const registar = api.registerForPlugin(this)
        
        registar.registerView('md-print', new MDPrintRenderer(this.app))
        registar.registerView('md-replace', new MDReplaceRenderer(this.app))
    }

	async loadSettings() {
		SQLSealMaterializer._settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(SQLSealMaterializer._settings);
	}
}