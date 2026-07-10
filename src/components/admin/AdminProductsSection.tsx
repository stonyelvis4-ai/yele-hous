import { ChangeEvent, Dispatch, FormEvent, RefObject, SetStateAction } from 'react'
import { BadgePercent, Box, ChevronDown, PackagePlus, Plus } from 'lucide-react'
import { Collection, Product, Category } from '../../types'
import { collectionFallbackImage, productFallbackImage } from '../../lib/imageFallbacks'
import { SmartMedia } from '../SmartMedia'

interface AdminProductsSectionProps {
  productCategories: Category[]
  collections: Collection[]
  products: Product[]
  collectionMap: Record<string, Collection>
  productForm: Omit<Product, 'id'>
  setProductForm: Dispatch<SetStateAction<Omit<Product, 'id'>>>
  editingProductId: string | null
  saveProduct: (event: FormEvent<HTMLFormElement>) => void
  cancelProductEditing: () => void
  productSuccessMessage: string
  galleryInputRef: RefObject<HTMLInputElement>
  cameraInputRef: RefObject<HTMLInputElement>
  galleryVideoInputRef: RefObject<HTMLInputElement>
  cameraVideoInputRef: RefObject<HTMLInputElement>
  handleProductImageFile: (event: ChangeEvent<HTMLInputElement>) => void
  handleProductVideoFile: (event: ChangeEvent<HTMLInputElement>) => void
  adminGalleryImageInput: string
  setAdminGalleryImageInput: Dispatch<SetStateAction<string>>
  addGalleryImageFromUrl: () => void
  setPrimaryGalleryImage: (image: string) => void
  removeGalleryImage: (image: string) => void
  adminColorsOpen: boolean
  setAdminColorsOpen: Dispatch<SetStateAction<boolean>>
  adminColorOptions: readonly string[]
  toggleAdminColor: (color: string) => void
  adminCustomColor: string
  setAdminCustomColor: Dispatch<SetStateAction<string>>
  addCustomAdminColor: () => void
  swatchColor: (name: string) => string
  startEditingProduct: (product: Product) => void
  deleteAdminProduct: (product: Product) => void
  collectionForm: Omit<Collection, 'id'>
  setCollectionForm: Dispatch<SetStateAction<Omit<Collection, 'id'>>>
  editingCollectionId: string | null
  saveCollection: (event: FormEvent<HTMLFormElement>) => void
  cancelCollectionEditing: () => void
  collectionSuccessMessage: string
  collectionGalleryInputRef: RefObject<HTMLInputElement>
  collectionCameraInputRef: RefObject<HTMLInputElement>
  collectionGalleryVideoInputRef: RefObject<HTMLInputElement>
  collectionCameraVideoInputRef: RefObject<HTMLInputElement>
  handleCollectionImageFile: (event: ChangeEvent<HTMLInputElement>) => void
  handleCollectionVideoFile: (event: ChangeEvent<HTMLInputElement>) => void
  startEditingCollection: (collection: Collection) => void
  deleteAdminCollection: (collection: Collection) => void
}

function uniqueImageList(items: string[]) {
  const normalized = items.map((item) => item.trim()).filter(Boolean)
  return normalized.filter((item, index) => normalized.indexOf(item) === index)
}

export function AdminProductsSection({
  productCategories,
  collections,
  products,
  collectionMap,
  productForm,
  setProductForm,
  editingProductId,
  saveProduct,
  cancelProductEditing,
  productSuccessMessage,
  galleryInputRef,
  cameraInputRef,
  galleryVideoInputRef,
  cameraVideoInputRef,
  handleProductImageFile,
  handleProductVideoFile,
  adminGalleryImageInput,
  setAdminGalleryImageInput,
  addGalleryImageFromUrl,
  setPrimaryGalleryImage,
  removeGalleryImage,
  adminColorsOpen,
  setAdminColorsOpen,
  adminColorOptions,
  toggleAdminColor,
  adminCustomColor,
  setAdminCustomColor,
  addCustomAdminColor,
  swatchColor,
  startEditingProduct,
  deleteAdminProduct,
  collectionForm,
  setCollectionForm,
  editingCollectionId,
  saveCollection,
  cancelCollectionEditing,
  collectionSuccessMessage,
  collectionGalleryInputRef,
  collectionCameraInputRef,
  collectionGalleryVideoInputRef,
  collectionCameraVideoInputRef,
  handleCollectionImageFile,
  handleCollectionVideoFile,
  startEditingCollection,
  deleteAdminCollection
}: AdminProductsSectionProps) {
  return (
    <div className="panel-card p-7">
      <div className="mb-6 flex items-center gap-3">
        <PackagePlus size={18} className="text-[#f04cb3]" />
        <h2 className="text-[22px] font-semibold text-[#241f2b]">Catalogue Premium (CRUD)</h2>
      </div>

      <form onSubmit={saveProduct} className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="form-label">NOM DU PRODUIT</label>
            <input
              value={productForm.name}
              onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Ex: Robe Satin Imperiale"
              className="field-input"
            />
          </div>
          <div>
            <label className="form-label">CATEGORIE</label>
            <select
              value={productForm.category}
              onChange={(event) => setProductForm((current) => ({ ...current, category: event.target.value as Category }))}
              className="field-input"
            >
              {productCategories.map((item) => (
                <option key={item} value={item} className="bg-white text-[#241f2b]">
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">COLLECTION</label>
            <select
              value={productForm.collectionId ?? ''}
              onChange={(event) => setProductForm((current) => ({ ...current, collectionId: event.target.value }))}
              className="field-input"
            >
              <option value="">Aucune collection</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="form-label">PRIX ACTUEL</label>
            <input
              type="number"
              min="0"
              value={productForm.price}
              onChange={(event) => setProductForm((current) => ({ ...current, price: Number(event.target.value) }))}
              placeholder="Ex: 35000"
              className="field-input"
            />
            <p className="admin-field-help">Prix de vente affiche au client, en FCFA.</p>
          </div>
          <div>
            <label className="form-label">PRIX BARRE</label>
            <input
              type="number"
              min="0"
              value={productForm.compareAtPrice}
              onChange={(event) => setProductForm((current) => ({ ...current, compareAtPrice: Number(event.target.value) }))}
              placeholder="Ex: 42000"
              className="field-input"
            />
            <p className="admin-field-help">Ancien prix ou prix de reference pour une promotion.</p>
          </div>
          <div>
            <label className="form-label">STOCK DISPONIBLE</label>
            <input
              type="number"
              min="0"
              value={productForm.stock}
              onChange={(event) => setProductForm((current) => ({ ...current, stock: Number(event.target.value) }))}
              placeholder="Ex: 5"
              className="field-input"
            />
            <p className="admin-field-help">Nombre de pieces actuellement disponibles.</p>
          </div>
        </div>

        <div>
          <label className="form-label">DESCRIPTION EDITORIALE</label>
          <textarea
            rows={3}
            value={productForm.description}
            onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Decrivez la piece, son allure, son univers et sa promesse."
            className="field-area"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="form-label">MATIERES</label>
            <input
              value={productForm.material}
              onChange={(event) => setProductForm((current) => ({ ...current, material: event.target.value }))}
              placeholder="Ex: Satin de soie, cuir saffiano, oud"
              className="field-input"
            />
          </div>
          <div>
            <label className="form-label">IMAGE PRINCIPALE</label>
            <input
              value={productForm.image}
              onChange={(event) =>
                setProductForm((current) => ({
                  ...current,
                  image: event.target.value,
                  images: uniqueImageList([event.target.value, ...current.images])
                }))
              }
              placeholder="Collez l'URL complete de l'image principale"
              className="field-input"
            />
            <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleProductImageFile} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleProductImageFile} />
            <input
              ref={galleryVideoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={handleProductVideoFile}
            />
            <input ref={cameraVideoInputRef} type="file" accept="video/*" capture="environment" className="hidden" onChange={handleProductVideoFile} />
            <div className="admin-upload-actions">
              <button type="button" className="secondary-button" onClick={() => cameraInputRef.current?.click()}>
                Prendre une photo
              </button>
              <button type="button" className="secondary-button" onClick={() => galleryInputRef.current?.click()}>
                Importer plusieurs photos
              </button>
            </div>
            <p className="admin-field-help">Choisissez une image principale puis ajoutez autant de visuels supplementaires que necessaire.</p>
            <div className="mt-3 grid gap-3">
              <input
                value={productForm.video ?? ''}
                onChange={(event) => setProductForm((current) => ({ ...current, video: event.target.value }))}
                placeholder="URL video produit (optionnelle)"
                className="field-input"
              />
              <div className="admin-upload-actions">
                <button type="button" className="secondary-button" onClick={() => cameraVideoInputRef.current?.click()}>
                  Filmer le produit
                </button>
                <button type="button" className="secondary-button" onClick={() => galleryVideoInputRef.current?.click()}>
                  Importer une video
                </button>
              </div>
              <p className="admin-field-help">Une petite video muette peut tourner en boucle sur la carte produit et dans la fiche detail.</p>
              {productForm.video ? (
                <div className="admin-image-preview">
                  <video
                    src={productForm.video}
                    poster={productForm.image || productFallbackImage(productForm.category)}
                    className="admin-image-preview-media"
                    controls
                    muted
                    playsInline
                  />
                </div>
              ) : null}
            </div>
            {productForm.image ? (
              <div className="admin-image-preview">
                <img src={productForm.image} alt="Apercu du produit" className="admin-image-preview-media" />
              </div>
            ) : null}
            <div className="mt-4 grid gap-3">
              <div className="admin-custom-color-row">
                <input
                  value={adminGalleryImageInput}
                  onChange={(event) => setAdminGalleryImageInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      addGalleryImageFromUrl()
                    }
                  }}
                  placeholder="Ajouter une URL d'image supplementaire"
                  className="field-input"
                />
                <button type="button" onClick={addGalleryImageFromUrl} className="secondary-button">
                  <Plus size={16} />
                  Ajouter
                </button>
              </div>
              {productForm.images.length ? (
                <div className="grid gap-3">
                  <p className="admin-field-help">Galerie du produit ({productForm.images.length} image(s)).</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {productForm.images.map((image, index) => (
                      <div key={`${image}-${index}`} className="rounded-[18px] border border-[#dfd3e4] bg-[#fffdfd] p-3">
                        <img src={image} alt={`Visuel produit ${index + 1}`} className="h-28 w-full rounded-[14px] object-cover" />
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="button" className="secondary-button" onClick={() => setPrimaryGalleryImage(image)}>
                            {productForm.image === image ? 'Image principale' : 'Definir en principale'}
                          </button>
                          <button type="button" className="secondary-button" onClick={() => removeGalleryImage(image)}>
                            Retirer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="form-label">COULEURS</label>
            <button
              type="button"
              className={`admin-color-toggle ${adminColorsOpen ? 'admin-color-toggle-open' : ''}`}
              onClick={() => setAdminColorsOpen((current) => !current)}
            >
              <span>
                {productForm.colors.filter(Boolean).length
                  ? `${productForm.colors.filter(Boolean).length} couleur(s) selectionnee(s)`
                  : 'Choisir des couleurs'}
              </span>
              <ChevronDown size={18} className={`admin-color-toggle-icon ${adminColorsOpen ? 'admin-color-toggle-icon-open' : ''}`} />
            </button>
            {adminColorsOpen ? (
              <>
                <div className="admin-color-grid">
                  {adminColorOptions.map((color) => {
                    const active = productForm.colors.some((item) => item.trim().toLowerCase() === color.toLowerCase())
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => toggleAdminColor(color)}
                        className={`admin-color-option ${active ? 'admin-color-option-active' : ''}`}
                      >
                        <span className="admin-color-swatch" style={{ backgroundColor: swatchColor(color) }} />
                        <span>{color}</span>
                      </button>
                    )
                  })}
                </div>
                <div className="admin-custom-color-row">
                  <input
                    value={adminCustomColor}
                    onChange={(event) => setAdminCustomColor(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        addCustomAdminColor()
                      }
                    }}
                    placeholder="Ajouter une couleur personnalisee"
                    className="field-input"
                  />
                  <button type="button" onClick={addCustomAdminColor} className="secondary-button">
                    <Plus size={16} />
                    Ajouter
                  </button>
                </div>
              </>
            ) : null}
            {productForm.colors.filter(Boolean).length ? (
              <div className="admin-selected-colors">
                {productForm.colors.filter(Boolean).map((color) => (
                  <button key={color} type="button" onClick={() => toggleAdminColor(color)} className="admin-selected-color-pill">
                    <span className="admin-color-swatch admin-color-swatch-sm" style={{ backgroundColor: swatchColor(color) }} />
                    <span>{color}</span>
                    <span className="admin-selected-color-remove">×</span>
                  </button>
                ))}
              </div>
            ) : null}
            <p className="admin-field-help">Cliquez sur les couleurs disponibles ou ajoutez une nuance personnalisee.</p>
          </div>
          <div>
            <label className="form-label">TAILLES OU FORMATS</label>
            <input
              value={productForm.sizes.join(', ')}
              onChange={(event) => setProductForm((current) => ({ ...current, sizes: event.target.value.split(',') }))}
              placeholder="Ex: S, M, L ou 50ml, 100ml"
              className="field-input"
            />
            <p className="admin-field-help">Separez chaque taille ou format par une virgule.</p>
          </div>
        </div>

        <label className="flex items-center gap-3 text-sm text-[#6f657a]">
          <input
            type="checkbox"
            checked={productForm.isBestSeller}
            onChange={(event) => setProductForm((current) => ({ ...current, isBestSeller: event.target.checked }))}
          />
          Best Seller
        </label>

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="primary-button px-6">
            <Box size={16} />
            {editingProductId ? 'Mettre a jour' : 'Ajouter le produit'}
          </button>
          {editingProductId ? (
            <button type="button" onClick={cancelProductEditing} className="secondary-button">
              Annuler
            </button>
          ) : null}
        </div>

        {productSuccessMessage ? (
          <p className="rounded-[18px] border border-[#cde6d6] bg-[#f4fff7] px-4 py-3 text-sm text-[#16825d]">
            {productSuccessMessage}
          </p>
        ) : null}
      </form>

      <div className="mt-6 space-y-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex flex-col gap-4 rounded-[22px] border border-[#dfd3e4] bg-[#fffdfd] p-4 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="flex items-center gap-4">
              <SmartMedia
                image={product.image}
                video={product.video}
                alt={product.name}
                fallbackImage={productFallbackImage(product.category)}
                className="h-14 w-14 rounded-[16px] object-cover"
              />
              <div>
                <h3 className="font-semibold text-[#241f2b]">{product.name}</h3>
                <p className="mt-1 text-sm text-[#8a7f95]">
                  {product.category} • stock {product.stock}
                </p>
                {product.collectionId && collectionMap[product.collectionId] ? (
                  <p className="mt-1 text-xs font-semibold tracking-[0.12em] text-[#f04cb3]">{collectionMap[product.collectionId].name}</p>
                ) : null}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => startEditingProduct(product)} className="secondary-button">
                Editer
              </button>
              <button type="button" onClick={() => deleteAdminProduct(product)} className="secondary-button">
                Corbeille
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 border-t border-[#e4d9e8] pt-8">
        <div className="mb-6 flex items-center gap-3">
          <BadgePercent size={18} className="text-[#f04cb3]" />
          <h2 className="text-[22px] font-semibold text-[#241f2b]">Tendances & Collections Signature</h2>
        </div>

        <form onSubmit={saveCollection} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={collectionForm.name}
              onChange={(event) => setCollectionForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Nom de la collection"
              className="field-input"
            />
            <input
              value={collectionForm.slug}
              onChange={(event) => setCollectionForm((current) => ({ ...current, slug: event.target.value }))}
              placeholder="Slug URL"
              className="field-input"
            />
          </div>
          <textarea
            rows={3}
            value={collectionForm.description}
            onChange={(event) => setCollectionForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Description editoriale de la collection"
            className="field-area"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <input
                value={collectionForm.image}
                onChange={(event) => setCollectionForm((current) => ({ ...current, image: event.target.value }))}
                placeholder="URL image de la tendance"
                className="field-input"
              />
              <input ref={collectionGalleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleCollectionImageFile} />
              <input ref={collectionCameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCollectionImageFile} />
              <input
                ref={collectionGalleryVideoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={handleCollectionVideoFile}
              />
              <input
                ref={collectionCameraVideoInputRef}
                type="file"
                accept="video/*"
                capture="environment"
                className="hidden"
                onChange={handleCollectionVideoFile}
              />
              <div className="admin-upload-actions">
                <button type="button" className="secondary-button" onClick={() => collectionCameraInputRef.current?.click()}>
                  Prendre une photo
                </button>
                <button type="button" className="secondary-button" onClick={() => collectionGalleryInputRef.current?.click()}>
                  Importer une photo
                </button>
              </div>
              <p className="admin-field-help">Changez l&apos;image de la tendance avec une URL, une photo prise sur place ou une image importee.</p>
              <input
                value={collectionForm.video ?? ''}
                onChange={(event) => setCollectionForm((current) => ({ ...current, video: event.target.value }))}
                placeholder="URL video de la tendance (optionnelle)"
                className="field-input mt-3"
              />
              <div className="admin-upload-actions">
                <button type="button" className="secondary-button" onClick={() => collectionCameraVideoInputRef.current?.click()}>
                  Filmer la tendance
                </button>
                <button type="button" className="secondary-button" onClick={() => collectionGalleryVideoInputRef.current?.click()}>
                  Importer une video
                </button>
              </div>
              <p className="admin-field-help">La video s&apos;affiche en boucle sur la carte tendance quand elle est renseignee.</p>
              {collectionForm.image ? (
                <div className="admin-image-preview">
                  <img src={collectionForm.image} alt="Apercu de la tendance" className="admin-image-preview-media" />
                </div>
              ) : null}
              {collectionForm.video ? (
                <div className="admin-image-preview mt-3">
                  <video
                    src={collectionForm.video}
                    poster={collectionForm.image || collectionFallbackImage}
                    className="admin-image-preview-media"
                    controls
                    muted
                    playsInline
                  />
                </div>
              ) : null}
            </div>
            <div className="flex items-start md:justify-end">
              <label className="flex items-center gap-3 text-sm text-[#6f657a]">
                <input
                  type="checkbox"
                  checked={collectionForm.isFeatured}
                  onChange={(event) => setCollectionForm((current) => ({ ...current, isFeatured: event.target.checked }))}
                />
                Afficher cette tendance sur l&apos;accueil
              </label>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="primary-button px-6">
              {editingCollectionId ? 'Mettre a jour la collection' : 'Ajouter la collection'}
            </button>
            {editingCollectionId ? (
              <button type="button" onClick={cancelCollectionEditing} className="secondary-button">
                Annuler
              </button>
            ) : null}
          </div>

          {collectionSuccessMessage ? (
            <p className="rounded-[18px] border border-[#cde6d6] bg-[#f4fff7] px-4 py-3 text-sm text-[#16825d]">
              {collectionSuccessMessage}
            </p>
          ) : null}
        </form>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {collections.map((collection) => (
            <div key={collection.id} className="rounded-[22px] border border-[#dfd3e4] bg-[#fffdfd] p-4">
              <div className="flex items-start gap-4">
                <SmartMedia
                  image={collection.image}
                  video={collection.video}
                  alt={collection.name}
                  fallbackImage={collectionFallbackImage}
                  className="h-16 w-16 rounded-[16px] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-[#241f2b]">{collection.name}</h3>
                    {collection.isFeatured ? (
                      <span className="rounded-full bg-[#ef4cae]/10 px-3 py-1 text-xs font-semibold text-[#f04cb3]">Featured</span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#6f657a]">{collection.description}</p>
                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={() => startEditingCollection(collection)} className="secondary-button">
                      Editer
                    </button>
                    <button type="button" onClick={() => deleteAdminCollection(collection)} className="secondary-button">
                      Corbeille
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
