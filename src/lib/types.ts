export interface ZoneSummary {
	id: string;
	name: string;
	status: string;
}

export interface ZoneSettings {
	[key: string]: string | number | boolean | Record<string, unknown>;
}

export interface ZoneWithSettings extends ZoneSummary {
	settings: ZoneSettings;
}

export interface SettingOption {
	value: string | number;
	label: string;
}

export interface SettingConfig {
	id: string;
	label: string;
	category: string;
	type: 'select' | 'toggle';
	options?: SettingOption[];
	description: string;
}

export interface UpdateResult {
	zoneId: string;
	zoneName: string;
	success: boolean;
	error?: string;
}
