import React, { useCallback, useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { ActivationCode, UserProfile } from '../types';
import {
  auth,
  db,
  createActivationCodes,
  deleteActivationCode,
  formatActivationCode,
  listActivationCodes,
} from '../services/firebase';

type Filter = 'ALL' | 'OPEN' | 'FULL';

const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('vi-VN') : '');

export const ActivationCodesPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [people, setPeople] = useState<Record<string, string>>({}); // uid -> "Tên (email)"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(10);
  const [note, setNote] = useState('');
  const [creating, setCreating] = useState(false);
  const [fresh, setFresh] = useState<ActivationCode[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [copied, setCopied] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listActivationCodes();
      setCodes(list);
      // Tra tên/email học viên đã dùng mã (chỉ để hiển thị)
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const map: Record<string, string> = {};
        usersSnap.forEach((d) => {
          const u = d.data() as UserProfile;
          map[d.id] = `${u.student_name || 'Học viên'} (${u.email || d.id})`;
        });
        setPeople(map);
      } catch {
        /* không bắt buộc */
      }
    } catch (e: any) {
      setError('Không tải được danh sách mã: ' + (e?.message || e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) reload();
  }, [open, reload]);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const created = await createActivationCodes(count, 1, note, auth.currentUser?.email || '');
      setFresh(created);
      await reload();
    } catch (e: any) {
      setError('Không tạo được mã: ' + (e?.message || e));
    } finally {
      setCreating(false);
    }
  };

  const copyText = async (text: string, tag: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(tag);
      setTimeout(() => setCopied(''), 1500);
    } catch {
      alert('Không sao chép tự động được, bạn hãy bôi đen và copy thủ công.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Xóa mã ${formatActivationCode(id)}? Mã này sẽ không dùng được nữa.`)) return;
    try {
      await deleteActivationCode(id);
      setCodes((prev) => prev.filter((c) => c.id !== id));
    } catch (e: any) {
      setError('Không xóa được: ' + (e?.message || e));
    }
  };

  const downloadCsv = () => {
    const rows = [['Mã', 'Ghi chú', 'Trạng thái', 'Tài khoản đã dùng', 'Ngày dùng', 'Ngày tạo']];
    codes.forEach((c) =>
      rows.push([
        formatActivationCode(c.id),
        c.note || '',
        c.used_by.length > 0 ? 'Đã dùng' : 'Chưa dùng',
        c.used_by.map((u) => people[u] || u).join('; '),
        fmtDate(c.used_at),
        fmtDate(c.created_at),
      ])
    );
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ma-kich-hoat.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const isFull = (c: ActivationCode) => c.used_by.length >= c.seats;
  const fullCount = codes.filter(isFull).length;
  const shown = codes.filter((c) => (filter === 'ALL' ? true : filter === 'FULL' ? isFull(c) : !isFull(c)));
  const freshText = fresh.map((c) => formatActivationCode(c.id)).join('\n');

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 pt-4">
      <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-sm">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 font-extrabold text-amber-950 cursor-pointer"
        >
          <span>🔑 Mã kích hoạt khóa học</span>
          <span className="text-xs font-bold text-amber-700">
            {open ? 'Thu gọn ▲' : codes.length ? `${fullCount}/${codes.length} mã đã dùng ▼` : 'Mở ▼'}
          </span>
        </button>

        {open && (
          <div className="px-4 pb-4 space-y-4 text-sm">
            {error && (
              <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">{error}</div>
            )}

            <div className="flex flex-wrap items-end gap-2">
              <label className="text-xs font-bold text-slate-600">
                Số mã
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="block w-24 border-2 border-amber-200 rounded-xl px-2 py-1.5"
                />
              </label>
              <label className="text-xs font-bold text-slate-600 flex-1 min-w-[180px]">
                Ghi chú (ví dụ: Đợt 1 - tháng 11)
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="block w-full border-2 border-amber-200 rounded-xl px-2 py-1.5"
                />
              </label>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="bg-amber-400 hover:bg-amber-500 text-amber-950 font-black px-4 py-2 rounded-xl disabled:opacity-60 cursor-pointer"
              >
                {creating ? 'Đang tạo...' : 'Tạo mã mới'}
              </button>
            </div>

            {fresh.length > 0 && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center justify-between mb-1">
                  <strong className="text-emerald-900 text-xs">
                    Đã tạo {fresh.length} mã mới (mỗi mã dùng cho 1 tài khoản) - gửi cho khách hàng:
                  </strong>
                  <button
                    onClick={() => copyText(freshText, 'fresh')}
                    className="text-xs font-bold underline text-emerald-800 cursor-pointer"
                  >
                    {copied === 'fresh' ? 'Đã sao chép ✓' : 'Sao chép tất cả'}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={freshText}
                  rows={Math.min(fresh.length, 8)}
                  className="w-full font-mono text-xs border rounded-lg p-2 bg-white"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {(['ALL', 'OPEN', 'FULL'] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border cursor-pointer ${
                    filter === f ? 'bg-amber-400 border-amber-500 text-amber-950' : 'bg-white border-slate-300 text-slate-600'
                  }`}
                >
                  {f === 'ALL'
                    ? `Tất cả (${codes.length})`
                    : f === 'OPEN'
                    ? `Chưa dùng (${codes.length - fullCount})`
                    : `Đã dùng (${fullCount})`}
                </button>
              ))}
              <button onClick={reload} className="text-xs underline text-slate-600 cursor-pointer">
                {loading ? 'Đang tải...' : 'Làm mới'}
              </button>
              <button
                onClick={downloadCsv}
                disabled={!codes.length}
                className="text-xs underline text-slate-600 cursor-pointer disabled:opacity-50"
              >
                Tải CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="py-1 pr-2">Mã</th>
                    <th className="py-1 pr-2">Ghi chú</th>
                    <th className="py-1 pr-2">Trạng thái</th>
                    <th className="py-1 pr-2">Tài khoản</th>
                    <th className="py-1 pr-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 align-top">
                      <td className="py-1.5 pr-2 font-mono font-bold whitespace-nowrap">
                        {formatActivationCode(c.id)}{' '}
                        <button
                          onClick={() => copyText(formatActivationCode(c.id), c.id)}
                          className="text-[10px] underline text-slate-500 cursor-pointer"
                        >
                          {copied === c.id ? '✓' : 'chép'}
                        </button>
                      </td>
                      <td className="py-1.5 pr-2">{c.note}</td>
                      <td className="py-1.5 pr-2 whitespace-nowrap">
                        <span className={isFull(c) ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                          {isFull(c) ? 'Đã dùng' : 'Chưa dùng'}
                        </span>
                        {c.used_at ? <span className="text-slate-400"> • {fmtDate(c.used_at)}</span> : null}
                      </td>
                      <td className="py-1.5 pr-2">
                        {c.used_by.map((u) => (
                          <div key={u}>{people[u] || u}</div>
                        ))}
                      </td>
                      <td className="py-1.5 pr-2 text-right">
                        {c.used_by.length === 0 && (
                          <button onClick={() => handleDelete(c.id)} className="text-rose-600 underline cursor-pointer">
                            xóa
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!shown.length && (
                    <tr>
                      <td colSpan={5} className="py-3 text-center text-slate-400">
                        Chưa có mã nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
