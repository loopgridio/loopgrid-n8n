import type {
	ICredentialDataDecryptedObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

function parseObject(context: IExecuteFunctions, value: string, label: string, itemIndex?: number): JsonObject {
	if (!value.trim()) return {};
	let parsed: unknown;
	try {
		parsed = JSON.parse(value);
	} catch {
		throw new NodeOperationError(context.getNode(), `${label} must be valid JSON`, { itemIndex });
	}
	if (parsed === null || Array.isArray(parsed) || typeof parsed !== 'object') {
		throw new NodeOperationError(context.getNode(), `${label} must be a JSON object`, { itemIndex });
	}
	return parsed as JsonObject;
}

function trimBaseUrl(context: IExecuteFunctions, value: unknown): string {
	const baseUrl = String(value ?? '').trim().replace(/\/+$/, '');
	if (!/^https?:\/\//i.test(baseUrl)) {
		throw new NodeOperationError(context.getNode(), 'LoopGrid Base URL must start with http:// or https://');
	}
	return baseUrl;
}

const operationOptions = [
	{ name: 'Record Decision', value: 'recordDecision', action: 'Record a decision' },
	{ name: 'Record Action', value: 'recordAction', action: 'Record an external action' },
	{ name: 'Record Outcome', value: 'recordOutcome', action: 'Record an observed outcome' },
	{ name: 'Submit Review', value: 'submitReview', action: 'Submit a human review' },
	{ name: 'Get Decision', value: 'getDecision', action: 'Get decision evidence' },
	{ name: 'Verify Decision', value: 'verifyDecision', action: 'Verify decision integrity' },
];

export class LoopGrid implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'LoopGrid',
		name: 'loopGrid',
		icon: { light: 'file:loopgrid.svg', dark: 'file:loopgrid.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Record and verify signed, tamper-evident evidence for AI-agent decisions',
		defaults: { name: 'LoopGrid' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [{ name: 'loopGridApi', required: true }],
		properties: [
			{
				displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true,
				options: operationOptions, default: 'recordDecision',
			},
			{
				displayName: 'Decision Type', name: 'decisionType', type: 'string', required: true,
				default: 'agent_decision', displayOptions: { show: { operation: ['recordDecision'] } },
			},
			{
				displayName: 'Service Name', name: 'serviceName', type: 'string', default: 'n8n',
				displayOptions: { show: { operation: ['recordDecision'] } },
			},
			{
				displayName: 'Privacy Mode', name: 'privacyMode', type: 'options', default: 'redacted',
				options: [
					{ name: 'Redacted', value: 'redacted' },
					{ name: 'Proof Only', value: 'proof_only' },
					{ name: 'Full', value: 'full' },
				],
				displayOptions: { show: { operation: ['recordDecision'] } },
			},
			{
				displayName: 'Agent (JSON)', name: 'agentJson', type: 'json', default: '{"id":"n8n-agent"}',
				displayOptions: { show: { operation: ['recordDecision'] } },
			},
			{
				displayName: 'Proposed Action (JSON)', name: 'proposedActionJson', type: 'json', default: '{}',
				displayOptions: { show: { operation: ['recordDecision'] } }, required: true,
			},
			{
				displayName: 'Authority (JSON)', name: 'authorityJson', type: 'json', default: '{}',
				displayOptions: { show: { operation: ['recordDecision'] } },
			},
			{
				displayName: 'Model (JSON)', name: 'modelJson', type: 'json', default: '{}',
				displayOptions: { show: { operation: ['recordDecision'] } },
			},
			{
				displayName: 'Context (JSON)', name: 'contextJson', type: 'json', default: '{}',
				displayOptions: { show: { operation: ['recordDecision'] } },
			},
			{
				displayName: 'Input Evidence (JSON)', name: 'inputJson', type: 'json', default: '{}',
				description: 'Only map data that should be captured as evidence',
				displayOptions: { show: { operation: ['recordDecision'] } },
			},
			{
				displayName: 'Metadata (JSON)', name: 'metadataJson', type: 'json', default: '{}',
				displayOptions: { show: { operation: ['recordDecision'] } },
			},
			{
				displayName: 'Idempotency Key', name: 'idempotencyKey', type: 'string', default: '',
				displayOptions: { show: { operation: ['recordDecision', 'recordAction', 'recordOutcome'] } },
			},
			{
				displayName: 'Decision ID', name: 'decisionId', type: 'string', default: '', required: true,
				displayOptions: { show: { operation: ['recordAction', 'recordOutcome', 'submitReview', 'getDecision', 'verifyDecision'] } },
			},
			{
				displayName: 'Tool', name: 'toolName', type: 'string', default: '', required: true,
				displayOptions: { show: { operation: ['recordAction'] } },
			},
			{
				displayName: 'External Reference', name: 'externalReference', type: 'string', default: '',
				displayOptions: { show: { operation: ['recordAction', 'recordOutcome'] } },
			},
			{
				displayName: 'Action Actor ID', name: 'actionActorId', type: 'string', default: 'external-system',
				displayOptions: { show: { operation: ['recordAction'] } },
			},
			{
				displayName: 'Action Details (JSON)', name: 'actionDetailsJson', type: 'json', default: '{}',
				displayOptions: { show: { operation: ['recordAction'] } },
			},
			{
				displayName: 'Outcome Status', name: 'outcomeStatus', type: 'string', default: 'succeeded', required: true,
				displayOptions: { show: { operation: ['recordOutcome'] } },
			},
			{
				displayName: 'Verified Against', name: 'verifiedAgainst', type: 'string', default: 'external-system', required: true,
				displayOptions: { show: { operation: ['recordOutcome'] } },
			},
			{
				displayName: 'Outcome Actor ID', name: 'outcomeActorId', type: 'string', default: 'n8n',
				displayOptions: { show: { operation: ['recordOutcome'] } },
			},
			{
				displayName: 'Outcome Details (JSON)', name: 'outcomeDetailsJson', type: 'json', default: '{}',
				displayOptions: { show: { operation: ['recordOutcome'] } },
			},
			{
				displayName: 'Review Action', name: 'reviewAction', type: 'options', default: 'approve',
				options: [{ name: 'Approve', value: 'approve' }, { name: 'Reject', value: 'reject' }],
				displayOptions: { show: { operation: ['submitReview'] } },
			},
			{
				displayName: 'Reviewer', name: 'reviewer', type: 'string', default: '', required: true,
				displayOptions: { show: { operation: ['submitReview'] } },
			},
			{
				displayName: 'Reason', name: 'reviewReason', type: 'string', typeOptions: { rows: 3 }, default: '',
				displayOptions: { show: { operation: ['submitReview'] } },
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const output: INodeExecutionData[] = [];
		const credentials = (await this.getCredentials('loopGridApi')) as ICredentialDataDecryptedObject;
		const baseUrl = trimBaseUrl(this, credentials.baseUrl);
		const workspaceId = String(credentials.workspaceId ?? 'default');

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const operation = this.getNodeParameter('operation', itemIndex) as string;
				let method: IHttpRequestOptions['method'] = 'GET';
				let path = '';
				let body: JsonObject | undefined;

				if (operation === 'recordDecision') {
					method = 'POST';
					path = '/api/v1/decisions';
					const metadata = parseObject(this, this.getNodeParameter('metadataJson', itemIndex, '{}') as string, 'Metadata', itemIndex);
					body = {
						decision_type: this.getNodeParameter('decisionType', itemIndex) as string,
						service_name: this.getNodeParameter('serviceName', itemIndex) as string,
						workspace_id: workspaceId,
						privacy_mode: this.getNodeParameter('privacyMode', itemIndex) as string,
						agent: parseObject(this, this.getNodeParameter('agentJson', itemIndex, '{}') as string, 'Agent', itemIndex),
						authority: parseObject(this, this.getNodeParameter('authorityJson', itemIndex, '{}') as string, 'Authority', itemIndex),
						model: parseObject(this, this.getNodeParameter('modelJson', itemIndex, '{}') as string, 'Model', itemIndex),
						context: parseObject(this, this.getNodeParameter('contextJson', itemIndex, '{}') as string, 'Context', itemIndex),
						input: parseObject(this, this.getNodeParameter('inputJson', itemIndex, '{}') as string, 'Input Evidence', itemIndex),
						proposed_action: parseObject(this, this.getNodeParameter('proposedActionJson', itemIndex, '{}') as string, 'Proposed Action', itemIndex),
						metadata: { ...metadata, source: 'n8n' },
					};
					const idempotencyKey = this.getNodeParameter('idempotencyKey', itemIndex, '') as string;
					if (idempotencyKey) body.idempotency_key = idempotencyKey;
				} else {
					const decisionId = encodeURIComponent(this.getNodeParameter('decisionId', itemIndex) as string);
					if (operation === 'recordAction') {
						method = 'POST'; path = `/api/v1/decisions/${decisionId}/events`;
						const payload = parseObject(this, this.getNodeParameter('actionDetailsJson', itemIndex, '{}') as string, 'Action Details', itemIndex);
						payload.tool = this.getNodeParameter('toolName', itemIndex) as string;
						const ref = this.getNodeParameter('externalReference', itemIndex, '') as string;
						if (ref) payload.external_reference = ref;
						body = { event_type: 'tool_executed', actor_type: 'tool', actor_id: this.getNodeParameter('actionActorId', itemIndex) as string, payload };
						const key = this.getNodeParameter('idempotencyKey', itemIndex, '') as string;
						if (key) body.idempotency_key = key;
					} else if (operation === 'recordOutcome') {
						method = 'POST'; path = `/api/v1/decisions/${decisionId}/events`;
						const payload = parseObject(this, this.getNodeParameter('outcomeDetailsJson', itemIndex, '{}') as string, 'Outcome Details', itemIndex);
						payload.status = this.getNodeParameter('outcomeStatus', itemIndex) as string;
						payload.verified_against = this.getNodeParameter('verifiedAgainst', itemIndex) as string;
						const ref = this.getNodeParameter('externalReference', itemIndex, '') as string;
						if (ref) payload.external_reference = ref;
						body = { event_type: 'outcome_observed', actor_type: 'integration', actor_id: this.getNodeParameter('outcomeActorId', itemIndex) as string, payload };
						const key = this.getNodeParameter('idempotencyKey', itemIndex, '') as string;
						if (key) body.idempotency_key = key;
					} else if (operation === 'submitReview') {
						method = 'POST'; path = `/api/v1/decisions/${decisionId}/review`;
						body = {
							action: this.getNodeParameter('reviewAction', itemIndex) as string,
							reviewer: this.getNodeParameter('reviewer', itemIndex) as string,
							reason: this.getNodeParameter('reviewReason', itemIndex, '') as string,
						};
					} else if (operation === 'getDecision') {
						path = `/api/v1/decisions/${decisionId}`;
					} else if (operation === 'verifyDecision') {
						path = `/api/v1/decisions/${decisionId}/verify`;
					} else {
						throw new NodeOperationError(this.getNode(), `Unsupported operation: ${operation}`, { itemIndex });
					}
				}

				const request: IHttpRequestOptions = {
					method,
					url: `${baseUrl}${path}`,
					json: true,
					returnFullResponse: false,
					timeout: 30000,
				};
				if (body !== undefined) request.body = body;
				const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'loopGridApi', request)) as JsonObject;
				output.push({
					json: { ...items[itemIndex].json, loopgrid: response },
					pairedItem: itemIndex,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					output.push({ json: { ...items[itemIndex].json, loopgrid_error: error instanceof Error ? error.message : 'LoopGrid request failed' }, pairedItem: itemIndex });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex });
			}
		}
		return [output];
	}
}
