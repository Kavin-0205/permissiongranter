// In-memory static data to replace frontend static data

export const db = {
  users: [
    { id: 'usr_1', name: 'Alice Chen', role: 'manager' },
    { id: 'usr_2', name: 'Bob Smith', role: 'user' },
  ],
  analytics: {
    totalExecutions: '14,285',
    executionsTrend: '+12%',
    systemHealth: '99.9%',
    systemHealthTrend: 'Stable',
    avgCompletionTime: '1.8s',
    avgCompletionTimeTrend: '-0.4s',
    activeUsers: '1,204',
    activeUsersTrend: '+5'
  },
  workflows: [
    { id: 'WF-001', name: 'Customer Onboarding', status: 'active', executions: 1250, lastRun: '10 mins ago', 
      steps: [
        { id: 'step-1', type: 'trigger', title: 'On New User Signup', config: 'Webhook from CRM' },
        { id: 'step-2', type: 'task', title: 'Enrich User Data', config: 'Clearbit API' },
        { id: 'step-3', type: 'approval', title: 'Manager Review', config: 'Requires 1 approval' },
        { id: 'step-4', type: 'notification', title: 'Send Welcome Email', config: 'SendGrid Template #42' },
      ]
    },
    { id: 'WF-002', name: 'Invoice Processing', status: 'draft', executions: 0, lastRun: '-', steps: [] },
    { id: 'WF-003', name: 'Lead Scoring', status: 'active', executions: 840, lastRun: '1 hour ago', steps: [] },
    { id: 'WF-004', name: 'Daily DB Backup', status: 'paused', executions: 45, lastRun: '1 day ago', steps: [] },
    { id: 'WF-005', name: 'Support Ticket Router', status: 'active', executions: 342, lastRun: '5 mins ago', steps: [] },
  ],
  executions: [
    { id: 'EXE-8921', workflowId: 'WF-001', workflow: 'Customer Onboarding', status: 'success', time: '2 mins ago', duration: '1.2s' },
    { id: 'EXE-8920', workflowId: 'WF-001', workflow: 'Invoice Processing', status: 'running', time: '5 mins ago', duration: '-' },
    { id: 'EXE-8919', workflowId: 'WF-004', workflow: 'Daily Backup', status: 'error', time: '1 hour ago', duration: '4.5s' },
    { id: 'EXE-8918', workflowId: 'WF-003', workflow: 'Lead Scoring', status: 'success', time: '3 hours ago', duration: '0.8s' },
  ],
  executionSteps: {
    'EXE-8920': [
      { id: 1, name: 'Webhook Received', status: 'success', time: '10:42:01 AM', duration: '120ms', log: 'Payload validated successfully. User ID: usr_9921' },
      { id: 2, name: 'Fetch CRM Data', status: 'success', time: '10:42:02 AM', duration: '850ms', log: 'Fetched profile from SFDC: { company: "Acme", role: "admin" }' },
      { id: 3, name: 'Manager Approval', status: 'running', time: '10:42:03 AM', duration: 'In Progress', log: 'Waiting for manager (mgr_821) approval. SLA: 24h.' },
      { id: 4, name: 'Provision Account', status: 'pending', time: '-', duration: '-', log: '-' },
      { id: 5, name: 'Send Welcome Email', status: 'pending', time: '-', duration: '-', log: '-' },
    ]
  },
  pendingApprovals: [
    { id: 'APP-102', wf: 'Vendor Payment', user: 'Alice Chen', details: 'Invoice #4412 for Software Subscriptions ($4,200)', time: '10 mins ago', priority: 'high', amount: '$4,200' },
    { id: 'APP-103', wf: 'System Access', user: 'Bob Smith', details: 'Requesting access to Production Database', time: '1 hour ago', priority: 'critical', amount: 'N/A' },
    { id: 'APP-104', wf: 'Refund Request', user: 'Charlie Day', details: 'Customer refund for order #9921 ($150)', time: '2 hours ago', priority: 'normal', amount: '$150' },
    { id: 'APP-105', wf: 'Marketing Blast', user: 'Diana Prince', details: 'Email campaign to 50k subscribers', time: '5 hours ago', priority: 'normal', amount: 'N/A' },
  ]
};
