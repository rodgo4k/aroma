import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar2 from "@/components/headers/Topbar2";
import Breadcumb from "@/components/common/Breadcumb";
import MetaComponent from "@/components/common/MetaComponent";
import Features from "@/components/products/Features";
import { getPerfumeById } from "@/api/perfumes";
import { getPerfumeDisplayData, getPerfumeAllImages } from "@/data/perfumes";
import { useContextElement } from "@/context/Context";

export default function PerfumePage() {
  const { id } = useParams();
  const { addProductToCart, isAddedToCartProducts, cartLoading, addToWishlist, removeFromWishlist, isAddedtoWishlist, wishListLoading } = useContextElement();
  const [perfume, setPerfume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [cartError, setCartError] = useState("");
  const [wishError, setWishError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getPerfumeById(id)
      .then(setPerfume)
      .catch((err) => setError(err.message || "Erro ao carregar"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <Topbar2 parentClass="tf-topbar bg-dark-5 topbar-bg" />
        <Header1 />
        <Breadcumb pageName="Catálogo" pageTitle="Perfume" />
        <section className="tf-section">
          <div className="container">
            <p className="text-muted text-center py-5">Carregando...</p>
          </div>
        </section>
        <Footer1 />
      </>
    );
  }
  if (error || !perfume) {
    return (
      <>
        <Topbar2 parentClass="tf-topbar bg-dark-5 topbar-bg" />
        <Header1 />
        <Breadcumb pageName="Catálogo" pageTitle="Perfume" />
        <section className="tf-section">
          <div className="container">
            <p className="text-muted text-center py-5">{error || "Perfume não encontrado."}</p>
            <p className="text-center">
              <Link to="/catalogo" className="btn btn-outline-primary">Voltar ao catálogo</Link>
            </p>
          </div>
        </section>
        <Footer1 />
      </>
    );
  }

  const d = getPerfumeDisplayData(perfume);
  const images = getPerfumeAllImages(perfume);
  const notes = perfume.notes || {};
  const variants = perfume.variants || [];
  const variantsWithPrice = variants.filter((v) => v.price_short != null || v.option0 != null);
  const mainImage = images[selectedImageIndex] || images[0];
  const inWishlist = isAddedtoWishlist(perfume.id);

  const metadata = {
    title: `${d.title} | Aroma`,
    description: d.description || `Perfume ${d.title} no catálogo Aroma.`,
  };

  return (
    <>
      <MetaComponent meta={metadata} />
      <Topbar2 parentClass="tf-topbar bg-dark-5 topbar-bg" />
      <Header1 />
      <Breadcumb pageName="Catálogo" pageTitle={d.title} />

      <section className="flat-spacing-24 tf-section">
        <div className="container">
          <div className="row g-4">
              <div className="col-12 col-md-5">
              <div
                className="bg-light rounded d-flex align-items-center justify-content-center mb-3 overflow-hidden"
                style={{ minHeight: 320, aspectRatio: "1" }}
              >
                {mainImage ? (
                  <img src={mainImage} alt={d.title} className="img-fluid" style={{ objectFit: "contain", maxHeight: 320 }} />
                ) : (
                  <span className="icon icon-user text-muted" style={{ fontSize: "4rem" }} />
                )}
              </div>
              {images.length > 1 ? (
                <div className="d-flex gap-2 flex-wrap">
                  {images.map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`border rounded p-1 overflow-hidden ${selectedImageIndex === i ? "border-primary border-2" : ""}`}
                      style={{ width: 56, height: 56, flexShrink: 0 }}
                      onClick={() => setSelectedImageIndex(i)}
                    >
                      <img src={src} alt="" className="w-100 h-100" style={{ objectFit: "contain" }} />
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ minHeight: 56 }} />
              )}
            </div>
            <div className="col-12 col-md-7">
              {d.catalogLabel && <span className="badge bg-primary mb-2">{d.catalogLabel}</span>}
              <h4 className="product-name mb-2">{d.title}</h4>
              <p className="price-wrap fw-medium text-primary fs-5 mb-3">{d.priceShort}</p>
              {d.description && (
                <p className="text-main-2 mb-3">{d.description}</p>
              )}
              {(notes.top?.length || notes.heart?.length || notes.base?.length) ? (
                <div className="mb-3">
                  <h6 className="text-main-2 mb-2">Notas</h6>
                  {notes.top?.length > 0 && <p className="text-sm mb-1"><strong>Topo:</strong> {notes.top.join(", ")}</p>}
                  {notes.heart?.length > 0 && <p className="text-sm mb-1"><strong>Coração:</strong> {notes.heart.join(", ")}</p>}
                  {notes.base?.length > 0 && <p className="text-sm mb-1"><strong>Base:</strong> {Array.isArray(notes.base) ? notes.base.join(", ") : notes.base}</p>}
                </div>
              ) : null}
              {variantsWithPrice.length > 0 && (
                <div className="mb-4">
                  <h6 className="text-main-2 mb-2">Opções</h6>
                  <ul className="list-unstyled text-sm">
                    {variantsWithPrice.slice(0, 10).map((v, i) => (
                      <li key={i} className="d-flex justify-content-between py-1">
                        <span>{v.option0 || "—"}</span>
                        <span>{v.price_short || ""}</span>
                      </li>
                    ))}
                    {variantsWithPrice.length > 10 && <li className="text-muted">+ {variantsWithPrice.length - 10} opções</li>}
                  </ul>
                </div>
              )}
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <button
                  type="button"
                  className="subscribe-button tf-btn animate-btn bg-dark-2 btn-lg text-white d-inline-flex align-items-center"
                  disabled={cartLoading}
                  onClick={async () => {
                    setCartError("");
                    try {
                      const snapshot = { id: perfume.id, title: d.title, imgSrc: mainImage || images[0] || "", price: d.priceMin ?? 0 };
                      await addProductToCart(perfume.id, 1, true, snapshot);
                    } catch (e) {
                      setCartError(e.message || "Erro ao adicionar ao carrinho");
                    }
                  }}
                >
                  <span className="icon icon-cart2 me-2" />
                  {isAddedToCartProducts(perfume.id) ? "No carrinho" : "Adicionar ao carrinho"}
                </button>
                <button
                  type="button"
                  className={`tf-btn btn-out-line-dark2 btn-lg ${inWishlist ? "wishlist-btn-active" : ""}`}
                  disabled={wishListLoading}
                  onClick={async () => {
                    setWishError("");
                    try {
                      if (inWishlist) await removeFromWishlist(perfume.id);
                      else await addToWishlist(perfume.id);
                    } catch (e) {
                      setWishError(e.message || "Erro ao atualizar lista de desejos");
                    }
                  }}
                  aria-label={inWishlist ? "Remover da lista de desejos" : "Adicionar à lista de desejos"}
                >
                  {inWishlist ? (
                    <svg className="wishlist-heart-filled" viewBox="0 0 24 24" fill="currentColor" width="1.25rem" height="1.25rem" aria-hidden>
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  ) : (
                    <span className="icon icon-heart2" style={{ fontSize: "1.25rem" }} />
                  )}
                </button>
              </div>
              {cartError && <p className="text-danger small mt-2">{cartError}</p>}
              {wishError && <p className="text-danger small mt-2">{wishError}</p>}
            </div>
          </div>
        </div>
      </section>

      <Features />
      <Footer1 />
    </>
  );
}
