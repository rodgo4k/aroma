import React from "react";
import { getPerfumeDisplayData } from "@/data/perfumes";

/**
 * Card de um perfume para o catálogo.
 * Se onSelect for passado, o clique abre o modal em vez de ir ao link.
 * @param {Object} perfume - Item bruto do JSON (com catalogSource).
 * @param {string} [className] - Classes adicionais no wrapper.
 * @param {function} [onSelect] - Callback ao clicar (abre modal); se não passado, o link externo é usado.
 */
export default function PerfumeCard({ perfume, className = "", onSelect }) {
  const d = getPerfumeDisplayData(perfume);

  const handleClick = (e) => {
    if (onSelect) {
      e.preventDefault();
      onSelect(perfume);
    }
  };

  const linkProps = onSelect
    ? { href: "#", onClick: handleClick }
    : { href: d.url, target: "_blank", rel: "noopener noreferrer" };

  return (
    <div className={`card-product grid style-1 ${className}`}>
      <div className="card-product-wrapper">
        <a className="product-img" {...linkProps}>
          {d.imageUrl ? (
            <>
              <img
                className="img-product lazyload"
                alt={d.title}
                src={d.imageUrl}
                width={513}
                height={513}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <img
                className="img-hover lazyload"
                alt=""
                src={d.imageUrl}
                width={513}
                height={513}
                aria-hidden
                referrerPolicy="no-referrer"
              />
            </>
          ) : (
            <div
              className="img-product d-flex align-items-center justify-content-center bg-light"
              style={{ width: "100%", aspectRatio: "1", minHeight: 200 }}
            >
              <span className="icon icon-user text-muted" style={{ fontSize: "3rem" }} />
            </div>
          )}
        </a>
        {d.catalogLabel && (
          <div className="on-sale-wrap">
            <span className="on-sale-item">{d.catalogLabel}</span>
          </div>
        )}
      </div>
      <div className="card-product-info">
        <a className="name-product link fw-medium text-md" {...linkProps}>
          {d.title}
        </a>
        <p className="price-wrap fw-medium">
          <span className="price-new text-primary">{d.priceShort}</span>
        </p>
      </div>
    </div>
  );
}
