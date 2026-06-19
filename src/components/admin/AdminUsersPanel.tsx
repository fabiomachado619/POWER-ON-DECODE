"use client";



import { FormEvent, useState } from "react";

import { EditUserModal, PencilIcon } from "@/components/admin/EditUserModal";



interface UserRow {

  id: string;

  name: string;

  email: string;

  createdAt: string;

  accesses: Array<{

    id: string;

    moduleName: string;

    accessStatus: string;

    expiresAt: string | null;

  }>;

}



interface ModuleOption {

  slug: string;

  name: string;

}



export function AdminUsersPanel({

  users,

  modules,

}: {

  users: UserRow[];

  modules: ModuleOption[];

}) {

  const [search, setSearch] = useState("");

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [form, setForm] = useState({

    name: "",

    email: "",

    moduleSlug: modules[0]?.slug ?? "",

    validityDays: "365",

    sendEmail: true,

  });



  const filtered = users.filter(

    (user) =>

      user.name.toLowerCase().includes(search.toLowerCase()) ||

      user.email.toLowerCase().includes(search.toLowerCase())

  );



  async function handleCreate(event: FormEvent) {

    event.preventDefault();

    setLoading(true);

    setMessage("");

    try {

      const response = await fetch("/api/admin/users", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify(form),

      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error ?? "Erro ao criar usuário.");

      setMessage("Usuário criado/liberado com sucesso. Senha padrão: 123456");

      window.location.reload();

    } catch (error) {

      setMessage(error instanceof Error ? error.message : "Erro inesperado.");

    } finally {

      setLoading(false);

    }

  }



  async function resetPassword(userId: string) {

    const response = await fetch(`/api/admin/users/${userId}/reset-password`, {

      method: "POST",

    });

    const data = await response.json();

    setMessage(data.message ?? data.error ?? "Senha redefinida para 123456.");

  }



  return (

    <div className="space-y-8">

      <div>

        <h1 className="section-title">Gerenciamento de usuários</h1>

        <p className="section-subtitle">

          Crie usuários, edite acessos e redefina senhas. Senha padrão: 123456.

        </p>

      </div>



      {message && (

        <div className="rounded-xl border border-brand/20 bg-brand-muted px-4 py-3 text-sm text-brand-dark">

          {message}

        </div>

      )}



      <form onSubmit={handleCreate} className="card grid gap-4 md:grid-cols-2">

        <h2 className="md:col-span-2 text-lg font-semibold text-ink">Cadastro manual</h2>

        <input

          className="input-field"

          placeholder="Nome"

          value={form.name}

          onChange={(e) => setForm({ ...form, name: e.target.value })}

          required

        />

        <input

          className="input-field"

          type="email"

          placeholder="E-mail"

          value={form.email}

          onChange={(e) => setForm({ ...form, email: e.target.value })}

          required

        />

        <select

          className="input-field"

          value={form.moduleSlug}

          onChange={(e) => setForm({ ...form, moduleSlug: e.target.value })}

        >

          {modules.map((module) => (

            <option key={module.slug} value={module.slug}>

              {module.name}

            </option>

          ))}

        </select>

        <input

          className="input-field"

          type="number"

          min="1"

          value={form.validityDays}

          onChange={(e) => setForm({ ...form, validityDays: e.target.value })}

        />

        <label className="flex items-center gap-2 text-sm text-ink md:col-span-2">

          <input

            type="checkbox"

            checked={form.sendEmail}

            onChange={(e) => setForm({ ...form, sendEmail: e.target.checked })}

          />

          Enviar e-mail de acesso

        </label>

        <button type="submit" disabled={loading} className="btn-primary md:col-span-2">

          {loading ? "Salvando..." : "Criar usuário e liberar acesso"}

        </button>

      </form>



      <div className="card">

        <input

          className="input-field mb-4"

          placeholder="Buscar por nome ou e-mail"

          value={search}

          onChange={(e) => setSearch(e.target.value)}

        />

        <div className="overflow-x-auto">

          <table className="min-w-full text-sm">

            <thead>

              <tr className="border-b border-divider text-ink-muted">

                <th className="px-3 py-2 text-left">Usuário</th>

                <th className="px-3 py-2 text-left">Acessos</th>

                <th className="px-3 py-2 text-left">Ações</th>

              </tr>

            </thead>

            <tbody>

              {filtered.map((user) => (

                <tr key={user.id} className="border-b border-divider/70">

                  <td className="px-3 py-3">

                    <p className="font-medium text-ink">{user.name}</p>

                    <p className="text-ink-muted">{user.email}</p>

                  </td>

                  <td className="px-3 py-3 text-ink-muted">

                    {user.accesses.length === 0

                      ? "Nenhum acesso"

                      : user.accesses.map((access) => (

                          <div key={access.id}>

                            {access.moduleName} — {access.accessStatus}

                            {access.expiresAt &&

                              ` até ${new Date(access.expiresAt).toLocaleDateString("pt-BR")}`}

                          </div>

                        ))}

                  </td>

                  <td className="px-3 py-3">

                    <div className="flex flex-wrap gap-2">

                      <button

                        type="button"

                        onClick={() => setEditingUserId(user.id)}

                        className="btn-secondary inline-flex items-center gap-2"

                        title="Editar"

                      >

                        <PencilIcon />

                        Editar

                      </button>

                      <button

                        type="button"

                        onClick={() => resetPassword(user.id)}

                        className="btn-secondary"

                      >

                        Redefinir senha

                      </button>

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>



      {editingUserId && (
        <EditUserModal
          userId={editingUserId}
          onClose={() => {
            setEditingUserId(null);
            window.location.reload();
          }}
          onUpdated={setMessage}
        />
      )}

    </div>

  );

}

