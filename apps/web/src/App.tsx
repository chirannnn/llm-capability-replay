import { useState } from 'react';

type ExecutionStatus = 'IDLE' | 'DISCOVERING' | 'REPLAYING' | 'WAITING_FOR_HUMAN' | 'COMPLETED' | 'FAILED';

interface ExecutionEvent {
  type: string;
  timestamp: string;
  step?: number;
  action?: any;
  status?: string;
  condition?: string;
  passed?: boolean;
  capability?: any;
  success?: boolean;
  executedSteps?: number;
  data?: string;
}

export default function App() {
  const [status, setStatus] = useState<ExecutionStatus>('IDLE');
  const [goal, setGoal] = useState('Find Auxiliary Engine course and open the Construction section');
  const [targetUrl, setTargetUrl] = useState('');
  const [events, setEvents] = useState<ExecutionEvent[]>([]);
  const [capability, setCapability] = useState<any>(null);
  const [enableHandoff, setEnableHandoff] = useState(false);

  const startDiscovery = async () => {
    setStatus('DISCOVERING');
    setEvents([]);
    setCapability(null);

    try {
      const response = await fetch('http://localhost:3000/api/discovery/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, targetUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to start discovery');
      }

      // Connect to SSE events
      const eventSource = new EventSource('http://localhost:3000/api/discovery/events');

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data) as ExecutionEvent;
        setEvents((prev) => [...prev, data]);

        if (data.type === 'completed') {
          setStatus('COMPLETED');
          setCapability(data.capability);
          eventSource.close();
        }
      };

      eventSource.onerror = () => {
        setStatus('FAILED');
        eventSource.close();
      };
    } catch (error) {
      setStatus('FAILED');
      console.error('Discovery error:', error);
    }
  };

  const startReplay = async () => {
    setStatus('REPLAYING');
    setEvents([]);
    setCapability(null);

    try {
      const response = await fetch('http://localhost:3000/api/replay/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artifactId: 'demo-capability', enableHandoff }),
      });

      if (!response.ok) {
        throw new Error('Failed to start replay');
      }

      // Connect to SSE events
      const eventSource = new EventSource('http://localhost:3000/api/replay/events');

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data) as ExecutionEvent;
        setEvents((prev) => [...prev, data]);

        if (data.type === 'completed') {
          setStatus('COMPLETED');
          eventSource.close();
        }
      };

      eventSource.onerror = () => {
        setStatus('FAILED');
        eventSource.close();
      };
    } catch (error) {
      setStatus('FAILED');
      console.error('Replay error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900">LLM Capability Replay</h1>
        <p className="mt-2 text-gray-600">Operator UI for LLM-driven discovery and deterministic replay</p>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel: Controls */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Goal</h2>
              <textarea
                className="w-full p-3 border rounded-md"
                rows={3}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Enter your goal..."
              />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Target</h2>
              <input
                type="text"
                className="w-full p-3 border rounded-md"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="Target application URL"
              />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Controls</h2>
              <div className="space-y-3">
                <button
                  onClick={startDiscovery}
                  disabled={status === 'DISCOVERING' || status === 'REPLAYING'}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Start Discovery
                </button>
                <button
                  onClick={startReplay}
                  disabled={status === 'DISCOVERING' || status === 'REPLAYING'}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  Run Replay
                </button>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="handoff"
                    checked={enableHandoff}
                    onChange={(e) => setEnableHandoff(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="handoff" className="text-sm text-gray-700">
                    Enable Human Handoff
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Live Status</h2>
              <div className="text-2xl font-bold text-blue-600">{status}</div>
            </div>
          </div>

          {/* Right Panel: Events and Results */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Live Events</h2>
              <div className="h-64 overflow-y-auto bg-gray-50 rounded p-3 space-y-2">
                {events.length === 0 ? (
                  <p className="text-gray-500 text-sm">No events yet</p>
                ) : (
                  events.map((event, index) => (
                    <div key={index} className="text-sm bg-white p-2 rounded border">
                      <span className="font-semibold text-blue-600">{event.type}</span>
                      <span className="text-gray-500 ml-2">{new Date(event.timestamp).toLocaleTimeString()}</span>
                      {event.step && <span className="text-gray-600 ml-2">Step {event.step}</span>}
                      {event.action && (
                        <div className="mt-1 text-gray-700">
                          {event.action.type}: {event.action.value}
                        </div>
                      )}
                      {event.status && (
                        <div className="mt-1 text-gray-700">Status: {event.status}</div>
                      )}
                      {event.data && (
                        <div className="mt-1 text-gray-700">{event.data}</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {capability && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Capability Artifact</h2>
                <div className="space-y-2 text-sm">
                  <div><strong>ID:</strong> {capability.id}</div>
                  <div><strong>Version:</strong> {capability.version}</div>
                  <div><strong>Goal:</strong> {capability.goal}</div>
                  <div><strong>Steps:</strong> {capability.steps?.length || 0}</div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Evidence</h2>
              <p className="text-sm text-gray-600">
                Evidence is written to <code className="bg-gray-100 px-1 rounded">evidence/</code>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Discovery: <code className="bg-gray-100 px-1 rounded">evidence/discovery-YYYYMMDD-HHMMSS/</code>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Replay: <code className="bg-gray-100 px-1 rounded">evidence/replay-YYYYMMDD-HHMMSS/</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
