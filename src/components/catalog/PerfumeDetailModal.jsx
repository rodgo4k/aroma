import React, { useEffect, useRef, useState } from "react";
import { getPerfumeDisplayData, getPerfumeAllImages } from "@/data/perfumes";

const MODAL_ID = "perfumeDetailModal";

export default function PerfumeDetailModal({ perfume, onClose }) {
  const modalRef = useRef(null);
  const cleanupRef = useRef(() => {});
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [inWishlist, setInWishlist] = useState(false);

  useEffect(() => {
    if (!perfume) return;
    const el = modalRef.current;
    if (!el || !onClose) return;
    import("bootstrap").then((bootstrap) => {
      if (!modalRef.current) return;
      const instance = bootstrap.Modal.getOrCreateInstance(modalRef.current);
      const handleHidden = () => onClose();
      modalRef.current.addEventListener("hidden.bs.modal", handleHidden);
      cleanupRef.current = () => {
        if (modalRef.current) {
          modalRef.current.removeEventListener("hidden.bs.modal", handleHidden);
        }
      };
      instance.show();
    }).catch(() => {});
    return () => cleanupRef.current();
  }, [perfume, onClose]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [perfume]);

  if (!perfume) return null;

  const d = getPerfumeDisplayData(perfume);
  const images = getPerfumeAllImages(perfume);
  const notes = perfume.notes || {};
  const variants = perfume.variants || [];
  const variantsWithPrice = variants.filter((v) => v.price_short != null || v.option0 != null);
  const mainImage = images[selectedImageIndex] || images[0];

  return (
    <div
      className="modal fade modalCentered"
      id={MODAL_ID}
      tabIndex={-1}
      aria-labelledby="perfumeDetailLabel"
      aria-hidden="true"
      ref={modalRef}
    >
      <div className="modal-dialog modal-dialog-centered modal-xl" style={{ maxWidth: "900px" }}>
        <div className="modal-content">
          <button
            type="button"
            className="icon-close icon-close-popup"
            data-bs-dismiss="modal"
            aria-label="Fechar"
          />
          <div className="modal-body p-4 p-md-5">
            <div className="row g-4">
              {/* Coluna esquerda: foto principal + miniaturas */}
              <div className="col-12 col-md-5">
                <div
                  className="bg-light rounded d-flex align-items-center justify-content-center mb-3 overflow-hidden"
                  style={{ minHeight: 320, aspectRatio: "1" }}
                >
                  {mainImage ? (
                    <img
                      src={mainImage}
                      alt={d.title}
                      className="img-fluid"
                      style={{ objectFit: "contain", maxHeight: 320 }}
                    />
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
                        <img
                          src={src}
                          alt=""
                          className="w-100 h-100"
                          style={{ objectFit: "contain" }}
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ minHeight: 56 }} />
                )}
              </div>
              {/* Coluna direita: informações e botões */}
              <div className="col-12 col-md-7">
                {d.catalogLabel && (
                  <span className="badge bg-primary mb-2">{d.catalogLabel}</span>
                )}
                <h4 className="product-name mb-2">{d.title}</h4>
                <p className="price-wrap fw-medium text-primary fs-5 mb-3">{d.priceShort}</p>
                {d.description && (
                  <p className="text-main-2 mb-3">{d.description}</p>
                )}
                {(notes.top?.length || notes.heart?.length || notes.base?.length) ? (
                  <div className="mb-3">
                    <h6 className="text-main-2 mb-2">Notas</h6>
                    {notes.top?.length > 0 && (
                      <p className="text-sm mb-1">
                        <strong>Topo:</strong> {notes.top.join(", ")}
                      </p>
                    )}
                    {notes.heart?.length > 0 && (
                      <p className="text-sm mb-1">
                        <strong>Coração:</strong> {notes.heart.join(", ")}
                      </p>
                    )}
                    {notes.base?.length > 0 && (
                      <p className="text-sm mb-1">
                        <strong>Base:</strong> {Array.isArray(notes.base) ? notes.base.join(", ") : notes.base}
                      </p>
                    )}
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
                      {variantsWithPrice.length > 10 && (
                        <li className="text-muted">+ {variantsWithPrice.length - 10} opções</li>
                      )}
                    </ul>
                  </div>
                )}
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="subscribe-button tf-btn animate-btn bg-dark-2 btn-lg text-white text-decoration-none d-inline-flex align-items-center"
                  >
                    <span className="icon icon-cart2 me-2" />
                    Adicionar ao carrinho
                  </a>
                  <button
                    type="button"
                    className={`tf-btn btn-out-line-dark2 btn-lg ${inWishlist ? "wishlist-btn-active" : ""}`}
                    onClick={() => setInWishlist((v) => !v)}
                    aria-label={inWishlist ? "Remover da lista de desejos" : "Adicionar à lista de desejos"}
                  >
                    <span
                      className={`icon ${inWishlist ? "icon-heart3" : "icon-heart2"}`}
                      style={{ fontSize: "1.25rem" }}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
