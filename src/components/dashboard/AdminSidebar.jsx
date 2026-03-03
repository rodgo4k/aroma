"use client";

import { Link, useLocation } from "react-router-dom";

const adminLinks = [
  { href: "/painel/catalogo", label: "Catálogo" },
  { href: "/painel/usuarios", label: "Usuários cadastrados" },
  // { href: "/painel/acesso", label: "Dados de acesso ao site" },
];

export default function AdminSidebar() {
  const { pathname } = useLocation();
  return (
    <>
      {adminLinks.map(({ href, label }) => (
        <li key={href}>
          <Link
            to={href}
            className={`text-sm link fw-medium my-account-nav-item ${pathname === href || (href === "/painel/catalogo" && pathname.startsWith("/painel/catalogo")) ? "active" : ""}`}
            data-bs-dismiss="offcanvas"
            aria-label={label}
          >
            {label}
          </Link>
        </li>
      ))}
    </>
  );
}
