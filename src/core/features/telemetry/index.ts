export enum TELEMETRY_EVENT_NAME {
	APP_OPENED = 'App opened',
	APP_CLOSED = 'App closed',
	APP_INSTALLED = 'App installed',
	APP_UPDATED = 'App updated',

	NOTE_CREATED = 'Note created',

	PROFILE_LOGIN = 'Profile log in',
	PROFILE_CREATED = 'Profile created',
	PROFILE_SELECTED = 'Profile selected',

	MAIN_WINDOW_LOADED = 'Main window loaded',
	MAIN_WINDOW_RESIZE = 'Main window resize',

	ABOUT_WINDOW_CLICK = 'Click for About window',
	DEV_TOOLS_TOGGLED = 'Dev Tools toggled',

	TELEMETRY_QUEUE_PROCESSED = 'Queued telemetry events sent',
}
