import React, { useEffect, useMemo, useState } from "react";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar2 from "@/components/headers/Topbar2";
import Breadcumb from "@/components/common/Breadcumb";
import MetaComponent from "@/components/common/MetaComponent";
import CatalogFilters from "@/components/catalog/CatalogFilters";
import PerfumeCard from "@/components/catalog/PerfumeCard";
import PerfumeDetailModal from "@/components/catalog/PerfumeDetailModal";
import Features from "@/components/products/Features";
import { getPerfumesList } from "@/api/perfumes";
import { getPerfumeDisplayData } from "@/data/perfumes";

const ITEMS_PER_PAGE = 24;
const metadata = {
  title: "Catálogo de Perfumes | Aroma",
  description: "Navegue pelo catálogo de perfumes.",
};

export default function CatalogPage() {
  const [perfumesList, setPerfumesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [catalogValue, setCatalogValue] = useState("all");
  const [searchValue, setSearchValue] = useState("");
  const [priceMinInput, setPriceMinInput] = useState("");
  const [priceMaxInput, setPriceMaxInput] = useState("");
  const [sortValue, setSortValue] = useState("default");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPerfume, setSelectedPerfume] = useState(null);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    getPerfumesList()
      .then((list) => {
        setPerfumesList(list);
      })
      .catch((err) => {
        setLoadError(err.message || "Erro ao carregar catálogo.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredAndSorted = useMemo(() => {
    let list = [...perfumesList];

    if (catalogValue !== "all") {
      list = list.filter((p) => p.catalogSource === catalogValue);
    }

    const search = searchValue.trim().toLowerCase();
    if (search) {
      list = list.filter((p) => {
        const d = getPerfumeDisplayData(p);
        return (
          (d.title && d.title.toLowerCase().includes(search)) ||
          (d.description && d.description.toLowerCase().includes(search))
        );
      });
    }

    const minP = priceMinInput === "" ? null : Number(priceMinInput);
    const maxP = priceMaxInput === "" ? null : Number(priceMaxInput);
    if (minP != null && !Number.isNaN(minP)) {
      list = list.filter((p) => getPerfumeDisplayData(p).priceMin >= minP);
    }
    if (maxP != null && !Number.isNaN(maxP)) {
      list = list.filter((p) => getPerfumeDisplayData(p).priceMin <= maxP);
    }

    if (sortValue === "title-asc") {
      list.sort((a, b) => getPerfumeDisplayData(a).title.localeCompare(getPerfumeDisplayData(b).title));
    } else if (sortValue === "title-desc") {
      list.sort((a, b) => getPerfumeDisplayData(b).title.localeCompare(getPerfumeDisplayData(a).title));
    } else if (sortValue === "price-asc") {
      list.sort((a, b) => getPerfumeDisplayData(a).priceMin - getPerfumeDisplayData(b).priceMin);
    } else if (sortValue === "price-desc") {
      list.sort((a, b) => getPerfumeDisplayData(b).priceMin - getPerfumeDisplayData(a).priceMin);
    }

    return list;
  }, [perfumesList, catalogValue, searchValue, priceMinInput, priceMaxInput, sortValue]);

  const totalFiltered = filteredAndSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / ITEMS_PER_PAGE));
  const pageIndex = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedList = useMemo(() => {
    const start = (pageIndex - 1) * ITEMS_PER_PAGE;
    return filteredAndSorted.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSorted, pageIndex]);

  const appliedFilterCount =
    (catalogValue !== "all" ? 1 : 0) +
    (searchValue.trim() ? 1 : 0) +
    (priceMinInput !== "" ? 1 : 0) +
    (priceMaxInput !== "" ? 1 : 0);

  const handleClearFilters = () => {
    setCatalogValue("all");
    setSearchValue("");
    setPriceMinInput("");
    setPriceMaxInput("");
    setCurrentPage(1);
  };

  return (
    <>
      <MetaComponent meta={metadata} />
      <Topbar2 parentClass="tf-topbar bg-dark-5 topbar-bg" />
      <Header1 />
      <Breadcumb pageName="Catálogo" pageTitle="Catálogo de perfumes" />

      <section className="flat-spacing-24 tf-section">
        <div className="container">
          <CatalogFilters
            catalogValue={catalogValue}
            onCatalogChange={(v) => {
              setCatalogValue(v);
              setCurrentPage(1);
            }}
            searchValue={searchValue}
            onSearchChange={(v) => {
              setSearchValue(v);
              setCurrentPage(1);
            }}
            priceMin={priceMinInput}
            priceMax={priceMaxInput}
            onPriceMinChange={(v) => {
              setPriceMinInput(v);
              setCurrentPage(1);
            }}
            onPriceMaxChange={(v) => {
              setPriceMaxInput(v);
              setCurrentPage(1);
            }}
            sortValue={sortValue}
            onSortChange={(v) => {
              setSortValue(v);
              setCurrentPage(1);
            }}
            totalCount={totalFiltered}
            appliedCount={appliedFilterCount}
            onClearFilters={handleClearFilters}
          />

          <div className="wrapper-shop tf-grid-layout tf-col-4" id="gridLayout">
            {loading ? (
              <div className="col-12 text-center py-5">
                <p className="text-muted">Carregando catálogo...</p>
              </div>
            ) : loadError ? (
              <div className="col-12 text-center py-5">
                <p className="text-muted">{loadError}</p>
                <button
                  type="button"
                  className="btn btn-outline-primary mt-2"
                  onClick={() => {
                    setLoadError(null);
                    setLoading(true);
                    getPerfumesList()
                      .then(setPerfumesList)
                      .catch((err) => setLoadError(err.message || "Erro ao carregar catálogo."))
                      .finally(() => setLoading(false));
                  }}
                >
                  Tentar novamente
                </button>
              </div>
            ) : paginatedList.length ? (
              paginatedList.map((perfume, i) => (
                <PerfumeCard
                  key={perfume.id ?? `perfume-${i}`}
                  perfume={perfume}
                  onSelect={setSelectedPerfume}
                />
              ))
            ) : (
              <div className="col-12 text-center py-5">
                <p className="text-muted">Nenhum perfume encontrado com os filtros selecionados.</p>
                <button type="button" className="btn btn-outline-primary mt-2" onClick={handleClearFilters}>
                  Limpar filtros
                </button>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <nav className="d-flex align-items-center justify-content-center gap-2 mt-4 flex-wrap" aria-label="Paginação do catálogo">
              <button
                type="button"
                className="btn btn-sm btn-outline-dark"
                disabled={pageIndex <= 1}
                onClick={() => setCurrentPage(1)}
              >
                Primeira
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-dark"
                disabled={pageIndex <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              <span className="text-sm text-main-2 px-2">
                Página {pageIndex} de {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline-dark"
                disabled={pageIndex >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Próxima
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-dark"
                disabled={pageIndex >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
              >
                Última
              </button>
            </nav>
          )}
        </div>
      </section>

      <PerfumeDetailModal
        perfume={selectedPerfume}
        onClose={() => setSelectedPerfume(null)}
      />
      <Features />
      <Footer1 />
    </>
  );
}
