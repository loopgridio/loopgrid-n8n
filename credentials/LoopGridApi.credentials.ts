import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

export class LoopGridApi implements ICredentialType {
	name = 'loopGridApi';
	displayName = 'LoopGrid API';
	icon: Icon = { light: 'file:loopgrid.svg', dark: 'file:loopgrid.dark.svg' };
	documentationUrl = 'https://loopgrid.io/integrations/';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'http://127.0.0.1:8000',
			required: true,
			description: 'LoopGrid service URL, without a trailing slash',
		},
		{
			displayName: 'Workspace ID',
			name: 'workspaceId',
			type: 'string',
			default: 'default',
			required: true,
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'LoopGrid service key. Use only the scopes required by this workflow.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-LoopGrid-Key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl.replace(new RegExp("/$"), "")}}',
			url: '/api/v1/decisions',
			method: 'GET',
			qs: {
				workspace_id: '={{$credentials.workspaceId}}',
				limit: 1,
			},
		},
	};
}
