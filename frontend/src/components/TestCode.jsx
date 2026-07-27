import { useEffect, useState, useRef } from "react";

const TestCode = () => {

    const onElementClick= (elementId) => {
    console.log("User clicked element:", elementId);
    alert(`You clicked ${elementId}! Now you can trigger an edit panel.`);
  };

    
  return (
    <div 
      className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-700"
      onClick={() => onElementClick("main-wrapper")}
    >
      {/* Navigation */}
      <nav 
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200"
        onClick={() => onElementClick("navigation-bar")}
      >
        <div 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          onClick={() => onElementClick("nav-container")}
        >
          <div 
            className="flex justify-between items-center h-20"
            onClick={() => onElementClick("nav-flex-wrapper")}
          >
            {/* Logo */}
            <div 
              className="flex-shrink-0 flex items-center cursor-pointer"
              onClick={() => onElementClick("logo-container")}
            >
              <div 
                className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center"
                onClick={() => onElementClick("logo-icon-box")}
              >
                <svg 
                  className="w-6 h-6 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  onClick={() => onElementClick("logo-svg")}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <span 
                className="ml-3 text-2xl font-bold tracking-tight text-slate-900"
                onClick={() => onElementClick("brand-name")}
              >
                LUMINA
              </span>
            </div>

            {/* Desktop Menu */}
            <div 
              className="hidden md:flex space-x-10"
              onClick={() => onElementClick("desktop-menu")}
            >
              <a 
                href="#" 
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
                onClick={() => onElementClick("nav-link-new")}
              >
                New Arrivals
              </a>
              <a 
                href="#" 
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
                onClick={() => onElementClick("nav-link-men")}
              >
                Men
              </a>
              <a 
                href="#" 
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
                onClick={() => onElementClick("nav-link-women")}
              >
                Women
              </a>
              <a 
                href="#" 
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
                onClick={() => onElementClick("nav-link-collections")}
              >
                Collections
              </a>
            </div>

            {/* Icons */}
            <div 
              className="flex items-center space-x-6"
              onClick={() => onElementClick("nav-icons-container")}
            >
              <button 
                className="p-2 text-slate-500 hover:text-indigo-600 transition-colors"
                onClick={() => onElementClick("search-button")}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button 
                className="p-2 text-slate-500 hover:text-indigo-600 transition-colors relative"
                onClick={() => onElementClick("cart-button")}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span 
                  className="absolute top-1 right-1 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  onClick={() => onElementClick("cart-badge")}
                >
                  3
                </span>
              </button>
              <button 
                className="md:hidden p-2 text-slate-500"
                onClick={() => onElementClick("mobile-menu-button")}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        className="relative overflow-hidden pt-16 pb-24 lg:pt-32 lg:pb-40"
        onClick={() => onElementClick("hero-section")}
      >
        {/* Background Decorative Elements */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10"
          onClick={() => onElementClick("bg-decor")}
        >
          <div 
            className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-3xl opacity-50"
            onClick={() => onElementClick("decor-blob-1")}
          ></div>
          <div 
            className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-3xl opacity-50"
            onClick={() => onElementClick("decor-blob-2")}
          ></div>
        </div>

        <div 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          onClick={() => onElementClick("hero-content-container")}
        >
          <div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
            onClick={() => onElementClick("hero-grid")}
          >
            {/* Left Column: Text */}
            <div 
              className="text-center lg:text-left"
              onClick={() => onElementClick("hero-text-column")}
            >
              <div 
                className="inline-flex items-center px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 mb-8"
                onClick={() => onElementClick("hero-badge")}
              >
                <span 
                  className="text-xs font-bold tracking-wider text-indigo-600 uppercase"
                  onClick={() => onElementClick("badge-text")}
                >
                  New Season Drop 2024
                </span>
              </div>
              <h1 
                className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-8"
                onClick={() => onElementClick("hero-headline")}
              >
                Redefining Your <br />
                <span 
                  className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500"
                  onClick={() => onElementClick("headline-gradient")}
                >
                  Daily Essentials
                </span>
              </h1>
              <p 
                className="text-lg lg:text-xl text-slate-600 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed"
                onClick={() => onElementClick("hero-description")}
              >
                Experience the perfect harmony of sustainable craftsmanship and modern aesthetics. Our curated collection is designed for those who value quality over quantity.
              </p>
              
              <div 
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
                onClick={() => onElementClick("hero-cta-group")}
              >
                <button 
                  className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-slate-200"
                  onClick={() => onElementClick("cta-primary")}
                >
                  Shop Collection
                </button>
                <button 
                  className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                  onClick={() => onElementClick("cta-secondary")}
                >
                  View Lookbook
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>

              {/* Trust Indicators */}
              <div 
                className="mt-12 pt-12 border-t border-slate-200 grid grid-cols-3 gap-4"
                onClick={() => onElementClick("trust-indicators")}
              >
                <div onClick={() => onElementClick("trust-item-1")}>
                  <div className="text-2xl font-bold text-slate-900" onClick={() => onElementClick("stat-1")}>50k+</div>
                  <div className="text-sm text-slate-500" onClick={() => onElementClick("stat-label-1")}>Happy Clients</div>
                </div>
                <div onClick={() => onElementClick("trust-item-2")}>
                  <div className="text-2xl font-bold text-slate-900" onClick={() => onElementClick("stat-2")}>100%</div>
                  <div className="text-sm text-slate-500" onClick={() => onElementClick("stat-label-2")}>Organic Cotton</div>
                </div>
                <div onClick={() => onElementClick("trust-item-3")}>
                  <div className="text-2xl font-bold text-slate-900" onClick={() => onElementClick("stat-3")}>24h</div>
                  <div className="text-sm text-slate-500" onClick={() => onElementClick("stat-label-3")}>Fast Delivery</div>
                </div>
              </div>
            </div>

            {/* Right Column: Visual */}
            <div 
              className="relative"
              onClick={() => onElementClick("hero-visual-column")}
            >
              <div 
                className="relative z-10 aspect-[4/5] rounded-[2rem] overflow-hidden bg-slate-200 shadow-2xl"
                onClick={() => onElementClick("image-container")}
              >
                {/* Placeholder for Product Image with Gradient */}
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center"
                  onClick={() => onElementClick("image-placeholder")}
                >
                  <svg 
                    className="w-32 h-32 text-slate-200 opacity-50" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                    onClick={() => onElementClick("placeholder-svg")}
                  >
                    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                
                {/* Floating Product Card */}
                <div 
                  className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/20"
                  onClick={() => onElementClick("floating-card")}
                >
                  <div 
                    className="flex justify-between items-center mb-2"
                    onClick={() => onElementClick("card-header")}
                  >
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest" onClick={() => onElementClick("card-category")}>Featured Product</span>
                    <div className="flex text-yellow-400" onClick={() => onElementClick("card-rating")}>
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900" onClick={() => onElementClick("card-title")}>Minimalist Wool Overcoat</h3>
                  <div className="flex items-center justify-between mt-4" onClick={() => onElementClick("card-footer")}>
                    <span className="text-xl font-extrabold text-slate-900" onClick={() => onElementClick("card-price")}>$249.00</span>
                    <button 
                      className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors"
                      onClick={() => onElementClick("card-add-button")}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Decorative Background Circles */}
              <div 
                className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-50 rounded-full -z-10"
                onClick={() => onElementClick("bg-circle-1")}
              ></div>
              <div 
                className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-50 rounded-full -z-10"
                onClick={() => onElementClick("bg-circle-2")}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Bar */}
      <div 
        className="bg-white border-y border-slate-200 py-10"
        onClick={() => onElementClick("feature-bar")}
      >
        <div 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          onClick={() => onElementClick("feature-container")}
        >
          <div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            onClick={() => onElementClick("feature-grid")}
          >
            <div className="flex items-center gap-4" onClick={() => onElementClick("feature-1")}>
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-indigo-600" onClick={() => onElementClick("feature-icon-1")}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              </div>
              <div>
                <div className="font-bold text-slate-900" onClick={() => onElementClick("feature-title-1")}>Free Shipping</div>
                <div className="text-xs text-slate-500" onClick={() => onElementClick("feature-desc-1")}>On orders over $150</div>
              </div>
            </div>
            <div className="flex items-center gap-4" onClick={() => onElementClick("feature-2")}>
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-indigo-600" onClick={() => onElementClick("feature-icon-2")}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04c0 4.833 1.89 9.13 4.983 12.223A11.954 11.954 0 0012 21.23a11.954 11.954 0 005.635-3.023c3.093-3.093 4.983-7.39 4.983-12.223z" /></svg>
              </div>
              <div>
                <div className="font-bold text-slate-900" onClick={() => onElementClick("feature-title-2")}>Secure Payment</div>
                <div className="text-xs text-slate-500" onClick={() => onElementClick("feature-desc-2")}>100% secure checkout</div>
              </div>
            </div>
            <div className="flex items-center gap-4" onClick={() => onElementClick("feature-3")}>
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-indigo-600" onClick={() => onElementClick("feature-icon-3")}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </div>
              <div>
                <div className="font-bold text-slate-900" onClick={() => onElementClick("feature-title-3")}>Easy Returns</div>
                <div className="text-xs text-slate-500" onClick={() => onElementClick("feature-desc-3")}>30-day return policy</div>
              </div>
            </div>
            <div className="flex items-center gap-4" onClick={() => onElementClick("feature-4")}>
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-indigo-600" onClick={() => onElementClick("feature-icon-4")}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <div>
                <div className="font-bold text-slate-900" onClick={() => onElementClick("feature-title-4")}>24/7 Support</div>
                <div className="text-xs text-slate-500" onClick={() => onElementClick("feature-desc-4")}>Dedicated help center</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCode;