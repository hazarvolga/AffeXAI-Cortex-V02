import React from 'react';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface AuditEvent {
    id: string;
    action: string;
    user: string;
    ip: string;
    status: 'success' | 'failure' | 'warning';
    timestamp: string;
}

interface AuditTableProps {
    events: AuditEvent[];
}

export const AuditTable: React.FC<AuditTableProps> = ({ events }) => {
    return (
        <div className="w-full overflow-hidden border border-white/5 bg-[#0a0a0a]/40 backdrop-blur-md">
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                    EVENT_LOG
                </h3>
                <span className="text-[9px] font-mono text-[#9df425]">LIVE_STREAM</span>
            </div>

            <table className="w-full text-left text-[10px] font-mono uppercase tracking-widest text-white/60">
                <thead className="bg-white/[0.02] text-white/30">
                    <tr>
                        <th className="py-3 px-6 font-normal">Timestamp</th>
                        <th className="py-3 px-6 font-normal">Action</th>
                        <th className="py-3 px-6 font-normal">User</th>
                        <th className="py-3 px-6 font-normal">Origin IP</th>
                        <th className="py-3 px-6 font-normal text-right">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {events.map((event) => (
                        <tr key={event.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="py-3 px-6 flex items-center gap-2">
                                <Clock className="w-3 h-3 opacity-30" />
                                {event.timestamp}
                            </td>
                            <td className="py-3 px-6 text-white group-hover:text-[#9df425] transition-colors">
                                {event.action}
                            </td>
                            <td className="py-3 px-6">{event.user}</td>
                            <td className="py-3 px-6 text-white/40">{event.ip}</td>
                            <td className="py-3 px-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    {event.status === 'success' && <CheckCircle className="w-3 h-3 text-[#9df425]" />}
                                    {event.status === 'failure' && <AlertCircle className="w-3 h-3 text-[#ff1a1a]" />}
                                    {event.status === 'warning' && <AlertCircle className="w-3 h-3 text-[#ff8c00]" />}
                                    <span className={`
                                        ${event.status === 'success' ? 'text-[#9df425]' : ''}
                                        ${event.status === 'failure' ? 'text-[#ff1a1a]' : ''}
                                        ${event.status === 'warning' ? 'text-[#ff8c00]' : ''}
                                    `}>
                                        {event.status}
                                    </span>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
