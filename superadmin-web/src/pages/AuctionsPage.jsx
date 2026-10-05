import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { Eye, AlertOctagon, Plus, Play, Gavel, Check, XCircle, UserCheck, Users } from 'lucide-react';
import { api } from '../api/client';
import { DataTable } from '../components/common/DataTable';
import { FilterBar } from '../components/common/FilterBar';
import { Pagination } from '../components/common/Pagination';
import { StatusBadge } from '../components/common/StatusBadge';
import { CurrencyText } from '../components/common/CurrencyText';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useAuthStore } from '../store/authStore';
export const AuctionsPage = () => {
    const queryClient = useQueryClient();
    const { accessToken } = useAuthStore();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedAuctionId, setSelectedAuctionId] = useState(null);
    const [forceCloseTarget, setForceCloseTarget] = useState(null);
    const [modalTab, setModalTab] = useState('bids'); // 'bids' | 'tickets'
    const [revokeTarget, setRevokeTarget] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newAuctionGroupId, setNewAuctionGroupId] = useState('');
    const [newAuctionMonth, setNewAuctionMonth] = useState(1);
    const [newAuctionStartNow, setNewAuctionStartNow] = useState(true);
    const [newAuctionMaxParticipants, setNewAuctionMaxParticipants] = useState(20);
    const [createError, setCreateError] = useState('');
    // Live Socket bids stream state
    const [liveBids, setLiveBids] = useState([]);
    const { data, isLoading } = useQuery({
        queryKey: ['superadmin-auctions', page, pageSize, statusFilter],
        queryFn: async () => {
            const res = await api.get('/api/v1/superadmin/auctions', {
                params: { page, limit: pageSize, status: statusFilter || undefined },
            });
            return res.data;
        },
        refetchInterval: 15000,
    });
    const { data: bidsData } = useQuery({
        queryKey: ['superadmin-auction-bids', selectedAuctionId],
        queryFn: async () => {
            if (!selectedAuctionId)
                return null;
            const res = await api.get(`/api/v1/superadmin/auctions/${selectedAuctionId}/bids`);
            return res.data.data;
        },
        enabled: Boolean(selectedAuctionId),
    });
    const { data: ticketsData, refetch: refetchTickets } = useQuery({
        queryKey: ['superadmin-auction-tickets', selectedAuctionId],
        queryFn: async () => {
            if (!selectedAuctionId)
                return null;
            const res = await api.get(`/api/v1/superadmin/auctions/${selectedAuctionId}/tickets`);
            return res.data;
        },
        enabled: Boolean(selectedAuctionId),
    });
    const revokeMutation = useMutation({
        mutationFn: async ({ ticketId, reason }) => {
            const res = await api.post(`/api/v1/superadmin/auctions/${selectedAuctionId}/tickets/${ticketId}/revoke`, { reason });
            return res.data;
        },
        onSuccess: () => {
            refetchTickets();
            setRevokeTarget(null);
        },
    });
    const approveTicketMutation = useMutation({
        mutationFn: async (ticketId) => {
            const res = await api.post(`/api/v1/superadmin/auctions/${selectedAuctionId}/tickets/${ticketId}/approve`);
            return res.data;
        },
        onSuccess: () => {
            refetchTickets();
            queryClient.invalidateQueries({ queryKey: ['superadmin-auctions'] });
        },
    });

    const rejectTicketMutation = useMutation({
        mutationFn: async ({ ticketId, reason }) => {
            const res = await api.post(`/api/v1/superadmin/auctions/${selectedAuctionId}/tickets/${ticketId}/reject`, { reason });
            return res.data;
        },
        onSuccess: () => {
            refetchTickets();
        },
    });

    // Socket.IO connection for live auction room
    useEffect(() => {
        if (!selectedAuctionId)
            return;
        const socketUrl = import.meta.env.DEV
            ? (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('railway') ? import.meta.env.VITE_API_URL : window.location.origin)
            : (import.meta.env.VITE_API_URL || 'https://naveen-chitfund-production.up.railway.app');
        const socket = io(socketUrl, {
            transports: ['websocket', 'polling'],
        });
        socket.emit('join_auction', {
            auctionId: selectedAuctionId,
            token: accessToken,
        });
        socket.on('bid_placed', (bidData) => {
            setLiveBids((prev) => [
                {
                    ticketNumber: bidData.ticketNumber,
                    bidPct: bidData.bidPct,
                    bidAt: bidData.bidAt || new Date().toISOString(),
                },
                ...prev,
            ]);
        });
        socket.on('auction:application_submitted', () => {
            refetchTickets();
        });
        socket.on('auction_closed', () => {
            queryClient.invalidateQueries({ queryKey: ['superadmin-auctions'] });
        });
        return () => {
            socket.emit('leave_auction', { auctionId: selectedAuctionId });
            socket.disconnect();
        };
    }, [selectedAuctionId, accessToken, queryClient, refetchTickets]);
    // Sync historical bids when detail loads
    useEffect(() => {
        if (bidsData?.bids) {
            setLiveBids(bidsData.bids.map((b) => ({
                ticketNumber: b.ticket_number,
                bidPct: Number(b.bid_pct),
                bidAt: b.created_at,
            })));
        }
    }, [bidsData]);
    // Force close mutation
    const forceCloseMutation = useMutation({
        mutationFn: async ({ id, reason }) => {
            const res = await api.post(`/api/v1/superadmin/auctions/${id}/force-close`, { reason });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['superadmin-auctions'] });
            setForceCloseTarget(null);
            setSelectedAuctionId(null);
        },
    });

    // Chit groups query for auction creation dropdown
    const { data: groupsData } = useQuery({
        queryKey: ['superadmin-chit-groups-dropdown'],
        queryFn: async () => {
            const res = await api.get('/api/v1/superadmin/chit-groups', { params: { limit: 100 } });
            return res.data?.data || [];
        },
        enabled: isCreateModalOpen,
    });

    // Create Auction Mutation
    const createAuctionMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/api/v1/superadmin/auctions', payload);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['superadmin-auctions'] });
            setIsCreateModalOpen(false);
            setNewAuctionGroupId('');
            setNewAuctionMonth(1);
            setCreateError('');
        },
        onError: (err) => {
            setCreateError(err.response?.data?.error || err.message || 'Failed to create auction');
        },
    });

    // Start Live Auction Mutation
    const startAuctionMutation = useMutation({
        mutationFn: async (id) => {
            const res = await api.post(`/api/v1/superadmin/auctions/${id}/start`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['superadmin-auctions'] });
        },
    });
    const columns = [
        {
            header: 'Chit Group & Month',
            accessorKey: 'group_name',
            cell: (item) => (<div>
          <span className="font-bold text-slate-900 dark:text-slate-100 block">{item.group_name}</span>
          <span className="text-xs text-slate-500">Month #{item.month_number} Reverse Auction</span>
        </div>),
        },
        {
            header: 'Chit Amount',
            accessorKey: 'chit_amount',
            cell: (item) => <CurrencyText amount={item.chit_amount} className="font-bold"/>,
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: (item) => <StatusBadge status={item.status}/>,
        },
        {
            header: 'Winning / Leading Discount',
            accessorKey: 'winning_bid_pct',
            cell: (item) => (<span className="font-bold text-gold-500">
          {item.winning_bid_pct ? `${item.winning_bid_pct}%` : 'In Progress'}
        </span>),
        },
        {
            header: 'Winner / Leading Ticket',
            cell: (item) => (<span className="text-xs text-slate-700 dark:text-slate-300">
          {item.winner_name ? `${item.winner_name} (#${item.winner_ticket_number})` : '-'}
        </span>),
        },
        {
            header: 'Actions',
            cell: (item) => (<div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {item.status === 'SCHEDULED' && (
            <button
              onClick={() => startAuctionMutation.mutate(item.id)}
              disabled={startAuctionMutation.isPending}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-2 py-1 rounded border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 cursor-pointer transition shadow-xs"
            >
              <Play className="w-3 h-3 fill-current" /> Start Live
            </button>
          )}
          {item.status !== 'COMPLETED' && (<button onClick={() => setForceCloseTarget(item)} className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline px-2 py-1 rounded border border-rose-200 dark:border-rose-900">
              Force Close
            </button>)}
        </div>),
        },
    ];
    const activeAuction = bidsData?.auction;
    const currentLowest = liveBids.length ? liveBids[0].bidPct : activeAuction?.winning_bid_pct || 5;
    return (<div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">
            Live Reverse Auctions Terminal
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Real-time oversight of subscriber bidding rooms, 40% statutory caps, and dividend allocation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsCreateModalOpen(true);
              setCreateError('');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gold-500 hover:bg-gold-400 text-stone-950 transition cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> Create Auction
          </button>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            40% Statutory Cap
          </span>
        </div>
      </div>

      <div className="bg-white/95 dark:bg-[#150A11]/95 border border-stone-200/90 dark:border-maroon-900/50 rounded-2xl shadow-sm p-5 backdrop-blur-md">
        <FilterBar searchQuery="" onSearchChange={() => { }} searchPlaceholder="Filter auctions...">
          <select value={statusFilter} onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
        }} className="text-xs py-2 px-3 bg-stone-50 dark:bg-[#1C0D18] border border-stone-200 dark:border-maroon-800/60 rounded-xl text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500">
            <option value="">All Statuses</option>
            <option value="LIVE">Live Bidding Only</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </FilterBar>

        <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} onRowClick={(item) => setSelectedAuctionId(item.id)} emptyTitle="No Auctions Found"/>

        <Pagination
          currentPage={page}
          totalPages={data?.meta?.totalPages || 1}
          totalItems={data?.meta?.total || 0}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Live Auction Monitor Modal */}
      <Modal isOpen={Boolean(selectedAuctionId)} onClose={() => setSelectedAuctionId(null)} title={activeAuction?.group_name ? `Reverse Auction Room: ${activeAuction.group_name}` : 'Live Auction Room'} maxWidth="2xl">
        <div className="space-y-6">
          {/* Room Header Info */}
          <div className="p-4 sm:p-4.5 rounded-2xl bg-gradient-to-r from-stone-50 via-amber-50/20 to-stone-50 dark:from-[#1A0B14] dark:via-[#260E1E] dark:to-[#1A0B14] border border-stone-200/90 dark:border-maroon-800/60 grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 text-xs shadow-xs">
            <div>
              <span className="text-stone-400 block font-bold text-[10px] sm:text-[11px] uppercase tracking-wider">Chit Value</span>
              <CurrencyText amount={activeAuction?.chit_amount} className="text-sm sm:text-base font-black text-stone-900 dark:text-stone-100"/>
            </div> 
            <div>
              <span className="text-stone-400 block font-bold text-[10px] sm:text-[11px] uppercase tracking-wider">Current Leading Discount</span>
              <span className="text-sm sm:text-base font-black text-gold-500 dark:text-gold-400">{currentLowest}%</span>
            </div>
            <div>
              <span className="text-stone-400 block font-bold text-[10px] sm:text-[11px] uppercase tracking-wider">Room Status</span>
              <StatusBadge status={activeAuction?.status || 'SCHEDULED'} className="mt-1"/>
            </div>
          </div>

          {/* Modal Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-stone-200 dark:border-maroon-900/50 pb-2">
            <button
              onClick={() => setModalTab('bids')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                modalTab === 'bids'
                  ? 'bg-gold-500 text-stone-950 shadow-xs'
                  : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-maroon-900/40'
              }`}
            >
              Live Bids ({liveBids.length})
            </button>
            <button
              onClick={() => setModalTab('tickets')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                modalTab === 'tickets'
                  ? 'bg-gold-500 text-stone-950 shadow-xs'
                  : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-maroon-900/40'
              }`}
            >
              Participation Tickets ({ticketsData?.data?.length || 0})
            </button>
          </div>

          {modalTab === 'bids' ? (
            <>
              {/* Live Feed Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h4 className="text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Live Bids Audit Stream ({liveBids.length})
                </h4>
                {activeAuction?.status === 'LIVE' && (
                  <button
                    onClick={() => setForceCloseTarget(activeAuction)}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-sm shadow-rose-600/30 flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
                  >
                    <AlertOctagon className="w-3.5 h-3.5" /> Force Close Auction
                  </button>
                )}
              </div>

              {/* Live Feed Stream */}
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {liveBids.length === 0 ? (
                  <div className="p-8 text-center text-xs text-stone-400 border border-dashed border-stone-200 dark:border-maroon-900/50 rounded-2xl">
                    Waiting for subscriber bids...
                  </div>
                ) : (
                  liveBids.map((b, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition duration-200 ${
                        idx === 0
                          ? 'bg-gradient-to-r from-gold-500/10 via-amber-500/10 to-gold-500/5 border-gold-500/50 ring-1 ring-gold-400/20 shadow-sm'
                          : 'bg-white/80 dark:bg-[#160B12] border-stone-200/70 dark:border-maroon-900/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4E1327] to-[#7A1F3D] text-gold-300 flex items-center justify-center font-black text-xs shadow-xs border border-gold-400/30">
                          #{b.ticketNumber}
                        </span>
                        <div>
                          <span className="font-bold text-stone-800 dark:text-stone-200 block">
                            Subscriber Ticket #{b.ticketNumber}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {new Date(b.bidAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-base text-gold-600 dark:text-gold-400 block">
                          {b.bidPct}%
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          Discount Offered
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            /* Participation Tickets View */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                    Applicant & Ticket Authorizations ({ticketsData?.data?.length || 0})
                  </h4>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">
                    Capacity Limit: {ticketsData?.data?.filter((t) => t.status === 'ACTIVE').length || 0} / {activeAuction?.max_participants || 20} Active Bidders Allowed
                  </span>
                </div>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {!ticketsData?.data || ticketsData.data.length === 0 ? (
                  <div className="p-8 text-center text-xs text-stone-400 border border-dashed border-stone-200 dark:border-maroon-900/50 rounded-2xl">
                    No members have applied for tickets in this auction session yet.
                  </div>
                ) : (
                  ticketsData.data.map((t) => (
                    <div
                      key={t.id}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                        t.status === 'APPLIED' || t.status === 'PENDING'
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'bg-stone-50 dark:bg-[#1A0B14] border-stone-200/80 dark:border-maroon-900/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-stone-900 dark:text-stone-100 bg-white dark:bg-[#12070D] px-2.5 py-1 rounded-lg border border-stone-200 dark:border-maroon-800/50">
                          {t.ticket_code}
                        </span>
                        <div>
                          <span className="font-bold text-stone-800 dark:text-stone-200 block">
                            {t.full_name || 'Subscriber'} (Slot #{t.ticket_number})
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {t.status === 'APPLIED' ? 'Requested: ' : 'Issued: '}
                            {new Date(t.issued_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={t.status} />

                        {/* If Applied: Show Approve and Reject buttons */}
                        {(t.status === 'APPLIED' || t.status === 'PENDING') && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => approveTicketMutation.mutate(t.id)}
                              disabled={approveTicketMutation.isPending}
                              className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-lg border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 transition cursor-pointer"
                            >
                              <Check className="w-3 h-3 stroke-[3]" /> Approve Access
                            </button>
                            <button
                              onClick={() => rejectTicketMutation.mutate({ ticketId: t.id, reason: 'Foreman capacity / risk decision' })}
                              disabled={rejectTicketMutation.isPending}
                              className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-rose-500/20 flex items-center gap-1 transition cursor-pointer"
                            >
                              <XCircle className="w-3 h-3" /> Reject
                            </button>
                          </div>
                        )}

                        {t.status === 'ACTIVE' && (
                          <button
                            onClick={() => setRevokeTarget(t)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-rose-500/20 transition cursor-pointer"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Revoke Ticket Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(revokeTarget)}
        onClose={() => setRevokeTarget(null)}
        title="Revoke Auction Participation Ticket"
        message={`Are you sure you want to revoke ticket ${revokeTarget?.ticket_code} issued to ${revokeTarget?.full_name}? The subscriber will no longer be permitted to place bids in this auction session.`}
        confirmText="Revoke Ticket"
        isDestructive
        requireReason
        reasonPlaceholder="e.g. Disqualified due to verified compliance breach or unauthorized proxy..."
        isLoading={revokeMutation.isPending}
        onConfirm={(reason) => {
          if (!revokeTarget) return;
          revokeMutation.mutate({
            ticketId: revokeTarget.id,
            reason,
          });
        }}
      />

      {/* Force Close Confirm Dialog with Mandatory Reason */}
      <ConfirmDialog isOpen={Boolean(forceCloseTarget)} onClose={() => setForceCloseTarget(null)} title="Force Close Live Auction" message={`Are you sure you want to forcibly close the auction for ${forceCloseTarget?.group_name}? This will declare the highest current discount bidder as the winner and run the dividend distribution engine immediately.`} confirmText="Force Close Now" isDestructive requireReason reasonPlaceholder="e.g. Unresponsive bidding timer or technical failover resolution..." isLoading={forceCloseMutation.isPending} onConfirm={(reason) => {
            if (!forceCloseTarget)
                return;
            forceCloseMutation.mutate({
                id: forceCloseTarget.id,
                reason,
            });
        }}/>

      {/* Create Auction Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateError('');
        }}
        title="Create / Schedule New Auction Round"
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newAuctionGroupId) {
              setCreateError('Please select a Chit Group');
              return;
            }
            createAuctionMutation.mutate({
              chitGroupId: newAuctionGroupId,
              monthNumber: Number(newAuctionMonth),
              startImmediately: newAuctionStartNow,
              maxParticipants: Number(newAuctionMaxParticipants),
            });
          }}
          className="space-y-4"
        >
          {createError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              {createError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
              Select Chit Group *
            </label>
            <select
              value={newAuctionGroupId}
              onChange={(e) => {
                setNewAuctionGroupId(e.target.value);
                const grp = groupsData?.find((g) => g.id === e.target.value);
                if (grp) {
                  setNewAuctionMonth(grp.current_month || 1);
                }
              }}
              required
              className="w-full text-xs py-2.5 px-3 bg-stone-50 dark:bg-[#1C0D18] border border-stone-200 dark:border-maroon-800/60 rounded-xl text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
            >
              <option value="">-- Choose Active Chit Group --</option>
              {groupsData?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} (₹{(g.chit_amount || 0).toLocaleString()} • Month {g.current_month || 1}/{g.duration_months || 20})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Auction Month Number *
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={newAuctionMonth}
                onChange={(e) => setNewAuctionMonth(Number(e.target.value))}
                required
                className="w-full text-xs py-2.5 px-3 bg-stone-50 dark:bg-[#1C0D18] border border-stone-200 dark:border-maroon-800/60 rounded-xl text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Max Participant Limit *
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={newAuctionMaxParticipants}
                onChange={(e) => setNewAuctionMaxParticipants(Number(e.target.value))}
                required
                className="w-full text-xs py-2.5 px-3 bg-stone-50 dark:bg-[#1C0D18] border border-stone-200 dark:border-maroon-800/60 rounded-xl text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
            <div>
              <span className="block text-xs font-bold text-stone-900 dark:text-stone-100">
                Start Live Immediately
              </span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400">
                Moves status directly to LIVE and alerts connected subscribers
              </span>
            </div>
            <input
              type="checkbox"
              checked={newAuctionStartNow}
              onChange={(e) => setNewAuctionStartNow(e.target.checked)}
              className="w-4 h-4 text-gold-500 rounded focus:ring-gold-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-maroon-900/50">
            <button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                setCreateError('');
              }}
              className="px-3.5 py-2 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-maroon-900/30 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createAuctionMutation.isPending}
              className="px-4 py-2 text-xs font-bold bg-gold-500 hover:bg-gold-400 text-stone-950 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {createAuctionMutation.isPending ? 'Creating...' : newAuctionStartNow ? 'Create & Start Live' : 'Schedule Auction'}
            </button>
          </div>
        </form>
      </Modal>
    </div>);
};

