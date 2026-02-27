import React from "react";
import { Link } from "react-router-dom";
import { getPerfumeDisplayData } from "@/data/perfumes";
import { useContextElement } from "@/context/Context";

/**
 * Card de um perfume para o catálogo.
 * Se onSelect for passado, o clique abre o modal em vez de ir ao link.
 * Sempre redireciona para a página do perfume no nosso site (/perfume/:id), nunca para link externo.
 */
export default function PerfumeCard({ perfume, className = "", onSelect }) {
  const { addProductToCart, isAddedToCartProducts, cartLoading } = useContextElement();
  const d = getPerfumeDisplayData(perfume);
  const perfumeUrl = perfume?.id ? `/perfume/${perfume.id}` : "/catalogo";

  const handleClick = (e) => {
    if (onSelect) {
      e.preventDefault();
      onSelect(perfume);
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!perfume?.id) return;
    const snapshot = { id: perfume.id, title: d.title, imgSrc: d.imageUrl ?? "", price: d.priceMin ?? 0 };
    addProductToCart(perfume.id, 1, true, snapshot);
  };

  const Wrapper = onSelect ? "a" : Link;
  const wrapperProps = onSelect
    ? { href: "#", onClick: handleClick }
    : { to: perfumeUrl };

  return (
    <div className={`card-product grid style-1 ${className}`}>
      <div className="card-product-wrapper">
        <Wrapper className="product-img" {...wrapperProps}>
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
        </Wrapper>
        {d.catalogLabel && (
          <div className="on-sale-wrap">
            <span className="on-sale-item">{d.catalogLabel}</span>
          </div>
        )}
      </div>
      <div className="card-product-info">
        <Wrapper className="name-product link fw-medium text-md" {...wrapperProps}>
          {d.title}
        </Wrapper>
        <p className="price-wrap fw-medium">
          <span className="price-new text-primary">{d.priceShort}</span>
        </p>
        <button
          type="button"
          className="tf-btn btn-out-line-dark2 animate-btn w-100 btn-sm mt-1"
          disabled={cartLoading}
          onClick={handleAddToCart}
        >
          {isAddedToCartProducts(perfume.id) ? "No carrinho" : "Adicionar ao carrinho"}
        </button>
      </div>
    </div>
  );
}
