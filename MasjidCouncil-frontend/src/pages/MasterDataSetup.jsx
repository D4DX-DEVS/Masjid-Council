import React, { useEffect, useMemo, useState } from "react";
import { ChevronRight, Download, Pencil, Plus, Trash2, X } from "lucide-react";
import AdminSidebar from "../components/AdminSidebar";
import SuperAdminSidebar from "../components/SuperAdminSidebar";
import PageHeader from "../components/PageHeader";
import ConfirmDialog from "../components/ConfirmDialog";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BASE = `${API_BASE_URL}/api/master-data`;

// District -> Area -> Unit, one column each.
const LEVELS = [
  { type: "district", title: "District", malayalam: "ജില്ല" },
  { type: "area", title: "Area", malayalam: "ഏരിയ" },
  { type: "unit", title: "Unit", malayalam: "പ്രാദേശിക ഘടകം" },
];

const MasterDataSetup = () => {
  const isSuperAdmin = !!localStorage.getItem("superAdminToken");
  const role = isSuperAdmin ? "superadmin" : "admin";
  const token = localStorage.getItem(isSuperAdmin ? "superAdminToken" : "adminToken");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState(null);
  const [selected, setSelected] = useState({ district: null, area: null });
  const [draft, setDraft] = useState(null); // { type, id?, title }
  const [deleting, setDeleting] = useState(null);

  const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const load = async () => {
    try {
      const res = await fetch(`${BASE}/all`, { headers: authHeaders });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to load master data");
      setItems(data.items);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const columns = useMemo(() => {
    const of = (type, parentId) =>
      items
        .filter((i) => i.type === type && String(i.parent || "") === String(parentId || ""))
        .sort((a, b) => a.title.localeCompare(b.title));

    return [
      of("district", null),
      selected.district ? of("area", selected.district._id) : [],
      selected.area ? of("unit", selected.area._id) : [],
    ];
  }, [items, selected]);

  const parentFor = (type) =>
    type === "district" ? null : type === "area" ? selected.district?._id : selected.area?._id;

  const save = async () => {
    const title = draft.title.trim();
    if (!title) return;

    try {
      const res = await fetch(draft.id ? `${BASE}/${draft.id}` : BASE, {
        method: draft.id ? "PUT" : "POST",
        headers: authHeaders,
        body: JSON.stringify(
          draft.id ? { title } : { type: draft.type, title, parent: parentFor(draft.type) }
        ),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Save failed");

      setDraft(null);
      await load();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const remove = async () => {
    try {
      const res = await fetch(`${BASE}/${deleting._id}`, { method: "DELETE", headers: authHeaders });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Delete failed");

      // Drop the selection if the deleted row (or its parent) was selected
      setSelected((prev) => ({
        district: prev.district?._id === deleting._id ? null : prev.district,
        area:
          prev.area?._id === deleting._id || prev.district?._id === deleting._id ? null : prev.area,
      }));
      setDeleting(null);
      await load();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
      setDeleting(null);
    }
  };

  const importFromApi = async () => {
    setImporting(true);
    setMessage(null);
    try {
      const res = await fetch(`${BASE}/import`, { method: "POST", headers: authHeaders });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Import failed");

      const { districts, areas, units, skipped } = data.counts;
      setMessage({
        type: "success",
        text: `Imported ${districts} districts, ${areas} areas, ${units} units${
          skipped ? ` (${skipped} skipped)` : ""
        }.`,
      });
      await load();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setImporting(false);
    }
  };

  const Sidebar = isSuperAdmin ? SuperAdminSidebar : AdminSidebar;

  const importButton = isSuperAdmin ? (
    <button
      onClick={importFromApi}
      disabled={importing}
      className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-[#6db14e] text-white text-sm font-medium hover:bg-[#5e9c43] disabled:opacity-60"
    >
      <Download className="w-4 h-4" />
      {importing ? "Importing…" : "Import from Unit API"}
    </button>
  ) : null;

  return (
    <div className="min-h-screen bg-[#F7F9FB] flex">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <PageHeader
          title="Master Data Setup"
          shortTitle="Master Data"
          subtitle="Districts, areas and local units used by every form"
          role={role}
          actions={importButton}
        />

        <div className="p-4 sm:p-8 pb-24 md:pb-8">
          {message && (
            <div
              className={`mb-4 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
                message.type === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-green-200 bg-green-50 text-green-700"
              }`}
            >
              <span>{message.text}</span>
              <button onClick={() => setMessage(null)} aria-label="Dismiss">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {LEVELS.map((level, index) => {
              const rows = columns[index];
              const parentChosen =
                index === 0 || (index === 1 ? !!selected.district : !!selected.area);

              return (
                <div
                  key={level.type}
                  className="bg-white border border-gray-200 rounded-2xl flex flex-col min-h-[16rem]"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{level.title}</p>
                      <p className="text-xs text-gray-500 truncate">{level.malayalam}</p>
                    </div>
                    <button
                      onClick={() => setDraft({ type: level.type, title: "" })}
                      disabled={!parentChosen}
                      title={
                        parentChosen
                          ? `Add ${level.title}`
                          : `Select a ${LEVELS[index - 1].title} first`
                      }
                      className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[28rem] p-2 space-y-1">
                    {loading && <p className="px-2 py-3 text-sm text-gray-400">Loading…</p>}

                    {!loading && !parentChosen && (
                      <p className="px-2 py-3 text-sm text-gray-400">
                        Select a {LEVELS[index - 1].title.toLowerCase()} to see its{" "}
                        {level.title.toLowerCase()}s.
                      </p>
                    )}

                    {!loading && parentChosen && rows.length === 0 && (
                      <p className="px-2 py-3 text-sm text-gray-400">
                        No {level.title.toLowerCase()}s yet.
                        {isSuperAdmin ? " Import from the Unit API or add one." : " Add one."}
                      </p>
                    )}

                    {rows.map((row) => {
                      const active =
                        selected.district?._id === row._id || selected.area?._id === row._id;

                      return (
                        <div
                          key={row._id}
                          className={`flex items-center gap-1 rounded-lg px-2 py-2 ${
                            active ? "bg-green-50" : "hover:bg-gray-50"
                          }`}
                        >
                          <button
                            onClick={() => {
                              if (level.type === "district")
                                setSelected({ district: row, area: null });
                              if (level.type === "area")
                                setSelected((prev) => ({ ...prev, area: row }));
                            }}
                            disabled={level.type === "unit"}
                            className={`flex-1 min-w-0 flex items-center gap-2 text-left text-sm ${
                              active ? "text-green-700 font-medium" : "text-gray-700"
                            } disabled:cursor-default`}
                          >
                            <span className="truncate">{row.title}</span>
                            {level.type !== "unit" && (
                              <ChevronRight className="w-4 h-4 flex-shrink-0 text-gray-300" />
                            )}
                          </button>

                          <button
                            onClick={() => setDraft({ type: row.type, id: row._id, title: row.title })}
                            aria-label={`Rename ${row.title}`}
                            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-white"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleting(row)}
                            aria-label={`Delete ${row.title}`}
                            className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-white"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {!isSuperAdmin && (
            <p className="mt-4 text-xs text-gray-500">
              Importing from the Unit API is limited to the super admin.
            </p>
          )}
        </div>
      </div>

      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5">
            <p className="text-base font-semibold text-gray-900 mb-3">
              {draft.id ? "Rename" : "Add"} {draft.type}
            </p>
            <input
              autoFocus
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && save()}
              placeholder={`${draft.type} name`}
              className="w-full h-11 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/40"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDraft(null)}
                className="h-10 px-4 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="h-10 px-4 rounded-lg bg-[#6db14e] text-white text-sm font-medium hover:bg-[#5e9c43]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        title={`Delete ${deleting?.title || ""}?`}
        description="Everything under it is deleted too. Submissions already saved keep their stored text."
        confirmLabel="Delete"
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
};

export default MasterDataSetup;
