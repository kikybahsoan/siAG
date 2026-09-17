import React, { useState, useRef } from "react";
import { SchoolMeta } from "../types";
import { resolveAssetUrl } from "../utils/assetUtils";
import { RESTORED_SCHOOL_META } from "../data/restoredSeedData";
import { 
  X, 
  Upload, 
  RotateCcw, 
  Check, 
  FileBadge, 
  Image as ImageIcon, 
  Type, 
  SlidersHorizontal,
  Info,
  CheckCircle2
} from "lucide-react";

interface KopCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolMeta: SchoolMeta;
  onSave: (updatedMeta: SchoolMeta) => void;
}

// Preset vector SVG logo for Tut Wuri Handayani / Kemdikbud
export const TUT_WURI_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%231E3A8A"><polygon points="50,5 95,35 78,92 22,92 5,35" fill="%230284c7" stroke="%23f59e0b" stroke-width="3"/><circle cx="50" cy="50" r="28" fill="%23ffffff"/><path d="M50 28 L56 42 L72 42 L59 52 L64 68 L50 58 L36 68 L41 52 L28 42 L44 42 Z" fill="%23f59e0b"/><text x="50" y="82" font-size="7" font-weight="bold" text-anchor="middle" fill="%231e3a8a" font-family="sans-serif">TUT WURI</text></svg>`;

export const KopCustomizerModal: React.FC<KopCustomizerModalProps> = ({
  isOpen,
  onClose,
  schoolMeta,
  onSave
}) => {
  const [formData, setFormData] = useState<SchoolMeta>({
    ...RESTORED_SCHOOL_META,
    ...schoolMeta,
    kopType: schoolMeta.kopType || "text",
    kopInstansi: schoolMeta.kopInstansi || RESTORED_SCHOOL_META.kopInstansi || "PEMERINTAH PROVINSI GORONTALO",
    kopDinas: schoolMeta.kopDinas || RESTORED_SCHOOL_META.kopDinas || "DINAS PENDIDIKAN DAN KEBUDAYAAN",
    kopSekolah: schoolMeta.kopSekolah || schoolMeta.sekolah || RESTORED_SCHOOL_META.kopSekolah || "SMK NEGERI 2 GORONTALO",
    kopAlamat: schoolMeta.kopAlamat || schoolMeta.alamat || RESTORED_SCHOOL_META.kopAlamat || "Jl. Drs. Achmad Najamuddin No. 34, Kel. Wumialo, Kec. Kota Tengah",
    kopKontak: schoolMeta.kopKontak || RESTORED_SCHOOL_META.kopKontak || "Telp: (0435) 822557 | Website: smkn2gorontalo.sch.id | Email: smkn2gorontalo@yahoo.co.id",
    kopNpsnAkreditasi: schoolMeta.kopNpsnAkreditasi || RESTORED_SCHOOL_META.kopNpsnAkreditasi || "NPSN: 40501083 | Kode Pos: 96128 | Terakreditasi A",
    logoUrl: schoolMeta.logoUrl || "/logo new.jpg",
    logoKananUrl: schoolMeta.logoKananUrl || "",
    showLogoKanan: schoolMeta.showLogoKanan || false
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const leftLogoInputRef = useRef<HTMLInputElement>(null);
  const rightLogoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "logoUrl" | "logoKananUrl" | "kopImageUrl"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      alert("Ukuran gambar maksimal 2.5 MB agar aplikasi tetap ringan.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setFormData(prev => ({
          ...prev,
          [field]: result,
          ...(field === "logoKananUrl" ? { showLogoKanan: true } : {})
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetToDefault = () => {
    if (window.confirm("Kembalikan format Kop dan Logo ke standar resmi SMKN 2 Gorontalo?")) {
      setFormData({
        ...formData,
        ...RESTORED_SCHOOL_META,
        kopType: "text",
        logoUrl: "/logo new.jpg",
        logoKananUrl: "",
        showLogoKanan: false
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div 
        className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                Kustomisasi Kop Surat &amp; Logo Sekolah
              </h2>
              <p className="text-xs text-neutral-400">
                Sesuaikan kop surat kedinasan, logo daerah, logo sekolah, dan format cetak dokumen resmi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-neutral-300">
          {/* Real-time Live Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <FileBadge className="w-3.5 h-3.5 text-indigo-400" />
                Pratinjau Tampilan Kop Surat Pada Kertas Cetak (Live Preview)
              </span>
              <span className="text-[10px] text-neutral-400 font-sans">
                Akan muncul di bagian atas Lembar Cetak Supervisi
              </span>
            </div>

            {/* Paper Preview Canvas */}
            <div className="bg-white text-black p-5 sm:p-6 rounded-2xl shadow-inner border border-neutral-300 select-none overflow-x-auto font-serif">
              {formData.kopType === "image" && formData.kopImageUrl ? (
                <div className="w-full flex justify-center pb-2">
                  <img
                    src={resolveAssetUrl(formData.kopImageUrl)}
                    alt="Banner Kop Surat"
                    className="max-h-32 w-full object-contain"
                  />
                </div>
              ) : (
                <div className="pb-3 border-b-4 border-double border-black">
                  <div className="flex items-center justify-between gap-4 sm:gap-6">
                    {/* Logo Kiri */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 flex items-center justify-center">
                      <img
                        src={resolveAssetUrl(formData.logoUrl || "logo new.jpg")}
                        alt="Logo Kiri"
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          const target = e.currentTarget;
                          const fallback = resolveAssetUrl("logo-new.jpg");
                          if (target.src !== fallback) {
                            target.src = fallback;
                          }
                        }}
                      />
                    </div>

                    {/* Teks Kop Tengah */}
                    <div className="text-center flex-1 space-y-0.5 min-w-0">
                      <h3 className="text-[11px] sm:text-xs font-sans font-bold uppercase tracking-wider text-neutral-900 leading-tight">
                        {formData.kopInstansi || "PEMERINTAH PROVINSI GORONTALO"}
                      </h3>
                      <h2 className="text-xs sm:text-sm font-sans font-bold uppercase tracking-wide text-neutral-900 leading-tight">
                        {formData.kopDinas || "DINAS PENDIDIKAN DAN KEBUDAYAAN"}
                      </h2>
                      <h1 className="text-base sm:text-lg font-sans font-extrabold uppercase tracking-tight text-black leading-tight py-0.5">
                        {formData.kopSekolah || formData.sekolah || "SMK NEGERI 2 GORONTALO"}
                      </h1>
                      <p className="text-[10px] sm:text-[11px] font-sans text-neutral-700 leading-tight">
                        {formData.kopAlamat || "Jl. Drs. Achmad Najamuddin No. 34, Kel. Wumialo, Kec. Kota Tengah"}
                      </p>
                      {formData.kopKontak && (
                        <p className="text-[9px] sm:text-[10px] font-sans text-neutral-600 leading-tight">
                          {formData.kopKontak}
                        </p>
                      )}
                      {formData.kopNpsnAkreditasi && (
                        <p className="text-[9px] sm:text-[10px] font-sans font-semibold text-neutral-800 leading-tight">
                          {formData.kopNpsnAkreditasi}
                        </p>
                      )}
                    </div>

                    {/* Logo Kanan */}
                    {formData.showLogoKanan && formData.logoKananUrl ? (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 flex items-center justify-center">
                        <img
                          src={resolveAssetUrl(formData.logoKananUrl)}
                          alt="Logo Kanan"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-20 sm:w-24 hidden sm:block flex-shrink-0" aria-hidden="true" />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex items-center gap-2 p-1 bg-neutral-950 rounded-2xl border border-neutral-800">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, kopType: "text" })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-medium transition-all ${
                formData.kopType !== "image"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Format Teks Kedinasan Resmi (Standar)</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, kopType: "image" })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-medium transition-all ${
                formData.kopType === "image"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Gunakan Banner Gambar Kop Utuh</span>
            </button>
          </div>

          {formData.kopType === "image" ? (
            /* Banner Image Mode */
            <div className="bg-neutral-950/60 p-5 rounded-2xl border border-neutral-800 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-200 mb-1">
                  Unggah Gambar Banner Kop Surat Sekolah (PNG / JPG / WebP)
                </label>
                <p className="text-[11px] text-neutral-400 mb-3">
                  Cocok jika sekolah Anda telah memiliki template gambar kop surat memanjang dari Tata Usaha/Percetakan.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <input
                    type="file"
                    ref={bannerInputRef}
                    onChange={(e) => handleFileUpload(e, "kopImageUrl")}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-xl font-medium transition-colors"
                  >
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <span>Pilih Berkas Banner Kop...</span>
                  </button>

                  {formData.kopImageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, kopImageUrl: "" })}
                      className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Hapus Banner</span>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                  Atau Masukkan URL Gambar Banner
                </label>
                <input
                  type="text"
                  value={formData.kopImageUrl || ""}
                  onChange={(e) => setFormData({ ...formData, kopImageUrl: e.target.value })}
                  placeholder="https://... atau data:image/..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          ) : (
            /* Text Mode */
            <div className="space-y-6">
              {/* Logo Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Logo Kiri (Utama) */}
                <div className="bg-neutral-950/60 p-4 rounded-2xl border border-neutral-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-xs text-neutral-200 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                      Logo Utama / Kiri (Sekolah)
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logoUrl: "/logo new.jpg" })}
                      className="text-[10px] text-neutral-400 hover:text-neutral-200 flex items-center gap-1"
                      title="Reset ke logo new.jpg bawaan"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Reset Bawaan</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-white border border-neutral-700 p-1 flex items-center justify-center flex-shrink-0">
                      <img
                        src={resolveAssetUrl(formData.logoUrl || "logo new.jpg")}
                        alt="Logo Utama"
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          const target = e.currentTarget;
                          const fallback = resolveAssetUrl("logo-new.jpg");
                          if (target.src !== fallback) {
                            target.src = fallback;
                          }
                        }}
                      />
                    </div>

                    <div className="flex-1 space-y-2">
                      <input
                        type="file"
                        ref={leftLogoInputRef}
                        onChange={(e) => handleFileUpload(e, "logoUrl")}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => leftLogoInputRef.current?.click()}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium border border-neutral-700 transition-colors"
                      >
                        <Upload className="w-3 h-3 text-indigo-400" />
                        <span>Unggah Logo Kustom</span>
                      </button>
                      <input
                        type="text"
                        value={formData.logoUrl || ""}
                        onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                        placeholder="Path atau URL (/logo new.jpg)"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-[11px] text-neutral-300 font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Logo Kanan (Opsional) */}
                <div className="bg-neutral-950/60 p-4 rounded-2xl border border-neutral-800">
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.showLogoKanan}
                        onChange={(e) => setFormData({ ...formData, showLogoKanan: e.target.checked })}
                        className="rounded border-neutral-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 bg-neutral-900"
                      />
                      <span className="font-bold text-xs text-neutral-200">
                        Aktifkan Logo Kanan (Sekunder)
                      </span>
                    </label>
                  </div>

                  {formData.showLogoKanan ? (
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-white border border-neutral-700 p-1 flex items-center justify-center flex-shrink-0">
                        {formData.logoKananUrl ? (
                          <img
                            src={resolveAssetUrl(formData.logoKananUrl)}
                            alt="Logo Kanan"
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <span className="text-[10px] text-neutral-400 text-center font-sans">Belum ada logo</span>
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        <input
                          type="file"
                          ref={rightLogoInputRef}
                          onChange={(e) => handleFileUpload(e, "logoKananUrl")}
                          accept="image/*"
                          className="hidden"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => rightLogoInputRef.current?.click()}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium border border-neutral-700 transition-colors"
                          >
                            <Upload className="w-3 h-3 text-indigo-400" />
                            <span>Unggah Logo</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, logoKananUrl: TUT_WURI_SVG, showLogoKanan: true })}
                            className="px-2.5 py-1.5 bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 rounded-lg text-[11px] font-semibold border border-indigo-700/50 transition-colors"
                            title="Gunakan lambang Tut Wuri Handayani resmi"
                          >
                            Preset Tut Wuri
                          </button>
                        </div>
                        <input
                          type="text"
                          value={formData.logoKananUrl || ""}
                          onChange={(e) => setFormData({ ...formData, logoKananUrl: e.target.value })}
                          placeholder="URL atau Data URI Logo Kanan"
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-[11px] text-neutral-300 font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-neutral-500 text-[11px] py-3 text-center border border-dashed border-neutral-800 rounded-xl">
                      Centang di atas jika ingin menampilkan logo dinas / Tut Wuri Handayani / Pemda di sisi kanan kop.
                    </div>
                  )}
                </div>
              </div>

              {/* Teks Kop Surat Fields */}
              <div className="bg-neutral-950/60 p-5 rounded-2xl border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-neutral-200 flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-indigo-400" />
                    Baris Teks Kop Surat Kedinasan
                  </h4>
                  <span className="text-[10px] text-neutral-400">
                    Bisa diedit bebas sesuai SK / nomenklatur resmi
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                      Baris 1: Instansi Induk / Pemerintah Daerah
                    </label>
                    <input
                      type="text"
                      value={formData.kopInstansi || ""}
                      onChange={(e) => setFormData({ ...formData, kopInstansi: e.target.value })}
                      placeholder="PEMERINTAH PROVINSI GORONTALO"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500 uppercase font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                      Baris 2: Dinas / Cabang Dinas
                    </label>
                    <input
                      type="text"
                      value={formData.kopDinas || ""}
                      onChange={(e) => setFormData({ ...formData, kopDinas: e.target.value })}
                      placeholder="DINAS PENDIDIKAN DAN KEBUDAYAAN"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500 uppercase font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                      Baris 3: Nama Satuan Pendidikan (Huruf Besar &amp; Tebal)
                    </label>
                    <input
                      type="text"
                      value={formData.kopSekolah || formData.sekolah || ""}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        kopSekolah: e.target.value,
                        sekolah: e.target.value // keep synced
                      })}
                      placeholder="SMK NEGERI 2 GORONTALO"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500 uppercase font-bold text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                      Baris 4: Alamat Lengkap &amp; Lokasi
                    </label>
                    <input
                      type="text"
                      value={formData.kopAlamat || ""}
                      onChange={(e) => setFormData({ ...formData, kopAlamat: e.target.value })}
                      placeholder="Jl. Drs. Achmad Najamuddin No. 34, Kel. Wumialo, Kec. Kota Tengah"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                      Baris 5: Kontak, Telp, Website &amp; Email
                    </label>
                    <input
                      type="text"
                      value={formData.kopKontak || ""}
                      onChange={(e) => setFormData({ ...formData, kopKontak: e.target.value })}
                      placeholder="Telp: (0435) 822557 | Website: smkn2gorontalo.sch.id"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                      Baris 6: NPSN, Akreditasi &amp; Kode Pos
                    </label>
                    <input
                      type="text"
                      value={formData.kopNpsnAkreditasi || ""}
                      onChange={(e) => setFormData({ ...formData, kopNpsnAkreditasi: e.target.value })}
                      placeholder="NPSN: 40501083 | Terakreditasi A | Kode Pos: 96128"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-neutral-800 bg-neutral-950/80 flex-shrink-0">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs font-semibold border border-neutral-700/80 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Standar SMKN 2 Gorontalo</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={savedSuccess}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 animate-bounce" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Simpan &amp; Terapkan Kop</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
