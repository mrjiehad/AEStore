export function renderHomePage(c: any) {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AECOIN Store - GTA Online Currency</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <!-- Gaming Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Orbitron:wght@400;700;900&family=Russo+One&display=swap" rel="stylesheet">
    <style>
        /* Custom font styles */
        body {
            font-family: 'Russo One', sans-serif;
        }
        
        h1, h2, h3, h4, h5, h6 {
            font-family: 'Bebas Neue', cursive;
            letter-spacing: 1px;
        }
        
        .orbitron {
            font-family: 'Orbitron', monospace;
        }
        
        /* Hero Slider Styles */
        .hero-slider {
            position: relative;
            height: 100vh;
            overflow: hidden;
        }
        
        .slide {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            transition: opacity 1s ease-in-out;
        }
        
        .slide.active {
            opacity: 1;
        }
        
        .slide-bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
        }
        
        .slide-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(to bottom, rgba(13, 13, 13, 0.3) 0%, rgba(13, 13, 13, 0.7) 50%, rgba(13, 13, 13, 0.9) 100%);
        }
        
        .slide-content {
            position: relative;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
        }
        
        /* Slider dots */
        .slider-dots {
            position: absolute;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 10px;
            z-index: 20;
        }
        
        .dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .dot.active {
            background: #FFD600;
            transform: scale(1.3);
        }
        
        /* Animated text */
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .animate-slide-up {
            animation: slideInUp 1s ease-out;
        }
        
        /* Glow effect */
        .gta-glow {
            text-shadow: 0 0 20px rgba(255, 214, 0, 0.5);
        }
        
        /* Scroll indicator */
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
                transform: translateY(0);
            }
            40% {
                transform: translateY(-10px);
            }
            60% {
                transform: translateY(-5px);
            }
        }
        
        .bounce-animation {
            animation: bounce 2s infinite;
        }
        
        /* Gallery Styles */
        .gallery-item {
            overflow: hidden;
            position: relative;
            cursor: pointer;
            aspect-ratio: 16/9;
        }
        
        .gallery-item img {
            transition: transform 0.5s ease;
        }
        
        .gallery-item:hover img {
            transform: scale(1.1);
        }
        
        .gallery-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(to top, rgba(13, 13, 13, 0.9), transparent);
            opacity: 0;
            transition: opacity 0.3s ease;
            display: flex;
            align-items: flex-end;
            padding: 1rem;
        }
        
        .gallery-item:hover .gallery-overlay {
            opacity: 1;
        }
        
        /* Package card image styles */
        .package-image {
            height: 120px;
            object-fit: cover;
            border-radius: 8px;
        }
        
        /* Floating animation for badges */
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
        }
        
        .float-badge {
            animation: float 2s ease-in-out infinite;
        }
        
        /* Pulse animation for buttons */
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        .pulse-animation {
            animation: pulse 2s ease-in-out infinite;
        }
        
        /* Footer Character Animation */
        @keyframes characterFloat {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-10px) scale(1.02); }
        }
        
        .character-float {
            animation: characterFloat 4s ease-in-out infinite;
        }
    </style>
</head>
<body class="bg-[#0D0D0D] text-white">
    <!-- Header (Absolute over hero) -->
    <header class="fixed top-0 z-50 w-full bg-[#0D0D0D]/80 backdrop-blur-sm border-b border-[#FFD600]/20">
        <div class="container mx-auto px-4">
            <div class="flex items-center justify-between h-16">
                <div class="flex items-center space-x-2">
                    <span class="text-2xl font-bold orbitron tracking-wider text-[#FFD600]">AECOIN</span>
                    <span class="text-xl">STORE</span>
                </div>
                <nav class="hidden md:flex space-x-6">
                    <a href="/" class="hover:text-[#FFD600] transition uppercase text-sm tracking-wider">Home</a>
                    <a href="/packages" class="hover:text-[#FFD600] transition uppercase text-sm tracking-wider">Packages</a>
                    <a href="#gallery" class="hover:text-[#FFD600] transition uppercase text-sm tracking-wider">Gallery</a>
                    <a href="/orders" class="hover:text-[#FFD600] transition uppercase text-sm tracking-wider">My Orders</a>
                    <a href="#faq" class="hover:text-[#FFD600] transition uppercase text-sm tracking-wider">FAQ</a>
                </nav>
                <div class="flex items-center space-x-4">
                    <button onclick="openCart()" class="relative">
                        <i class="fas fa-shopping-cart text-xl hover:text-[#FFD600] transition"></i>
                        <span id="cart-count" class="absolute -top-2 -right-2 bg-[#FFD600] text-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">0</span>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- Full Page Hero Slider -->
    <section class="hero-slider">
        <!-- Slide 1 -->
        <div class="slide active">
            <div class="slide-bg" style="background-image: url('https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop');"></div>
            <div class="slide-overlay"></div>
            <div class="slide-content">
                <div class="container mx-auto px-4 text-center">
                    <div class="mb-6">
                        <i class="fas fa-gamepad text-[#FFD600] text-6xl animate-slide-up"></i>
                    </div>
                    <h1 class="text-7xl md:text-9xl font-bold mb-6 animate-slide-up tracking-wider">
                        <span class="text-[#FFD600] gta-glow">AECOIN</span> STORE
                    </h1>
                    <p class="text-2xl md:text-3xl mb-8 animate-slide-up orbitron" style="animation-delay: 0.2s;">
                        Your #1 Source for GTA Online Currency
                    </p>
                    <div class="flex justify-center gap-4 animate-slide-up" style="animation-delay: 0.4s;">
                        <a href="#packages" class="bg-[#FFD600] text-black px-8 py-4 rounded-lg font-bold hover:bg-yellow-400 transition transform hover:scale-105 text-lg pulse-animation uppercase tracking-wider">
                            <i class="fas fa-shopping-bag mr-2"></i>
                            Shop Now
                        </a>
                        <a href="#gallery" class="border-2 border-[#FFD600] text-[#FFD600] px-8 py-4 rounded-lg font-bold hover:bg-[#FFD600]/10 transition text-lg uppercase tracking-wider">
                            <i class="fas fa-images mr-2"></i>
                            View Gallery
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Slide 2 -->
        <div class="slide">
            <div class="slide-bg" style="background-image: url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop');"></div>
            <div class="slide-overlay"></div>
            <div class="slide-content">
                <div class="container mx-auto px-4 text-center">
                    <h2 class="text-6xl md:text-8xl font-bold mb-6 tracking-wider">
                        INSTANT <span class="text-[#FFD600] gta-glow">DELIVERY</span>
                    </h2>
                    <p class="text-xl md:text-2xl mb-8 orbitron">
                        Get your codes immediately after payment
                    </p>
                    <div class="flex justify-center gap-8 text-lg">
                        <div class="flex items-center">
                            <i class="fas fa-bolt text-[#FFD600] text-3xl mr-3"></i>
                            <span>Instant Codes</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-shield-alt text-[#FFD600] text-3xl mr-3"></i>
                            <span>100% Secure</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-headset text-[#FFD600] text-3xl mr-3"></i>
                            <span>24/7 Support</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Slide 3 -->
        <div class="slide">
            <div class="slide-bg" style="background-image: url('https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=2065&auto=format&fit=crop');"></div>
            <div class="slide-overlay"></div>
            <div class="slide-content">
                <div class="container mx-auto px-4 text-center">
                    <h2 class="text-6xl md:text-8xl font-bold mb-6 tracking-wider">
                        BEST <span class="text-[#FFD600] gta-glow">PRICES</span>
                    </h2>
                    <p class="text-xl md:text-2xl mb-8 orbitron">
                        Save up to 11% on all AECOIN packages
                    </p>
                    <div class="bg-[#0D0D0D]/80 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto">
                        <div class="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p class="text-3xl font-bold text-[#FFD600] orbitron">RM60</p>
                                <p class="text-gray-400">500 AECOIN</p>
                            </div>
                            <div>
                                <p class="text-3xl font-bold text-[#FFD600] orbitron">RM295</p>
                                <p class="text-gray-400">3000 AECOIN</p>
                            </div>
                            <div>
                                <p class="text-3xl font-bold text-[#FFD600] orbitron">RM980</p>
                                <p class="text-gray-400">10000 AECOIN</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Slide 4 -->
        <div class="slide">
            <div class="slide-bg" style="background-image: url('https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?q=80&w=2071&auto=format&fit=crop');"></div>
            <div class="slide-overlay"></div>
            <div class="slide-content">
                <div class="container mx-auto px-4 text-center">
                    <h2 class="text-6xl md:text-8xl font-bold mb-6 tracking-wider">
                        TRUSTED BY <span class="text-[#FFD600] gta-glow">GAMERS</span>
                    </h2>
                    <p class="text-xl md:text-2xl mb-8 orbitron">
                        Join thousands of satisfied customers worldwide
                    </p>
                    <div class="grid grid-cols-4 gap-8 max-w-3xl mx-auto">
                        <div class="text-center">
                            <p class="text-4xl font-bold text-[#FFD600] orbitron">10K+</p>
                            <p class="text-gray-400">Happy Gamers</p>
                        </div>
                        <div class="text-center">
                            <p class="text-4xl font-bold text-[#FFD600] orbitron">99.9%</p>
                            <p class="text-gray-400">Uptime</p>
                        </div>
                        <div class="text-center">
                            <p class="text-4xl font-bold text-[#FFD600] orbitron">24/7</p>
                            <p class="text-gray-400">Support</p>
                        </div>
                        <div class="text-center">
                            <p class="text-4xl font-bold text-[#FFD600] orbitron">5★</p>
                            <p class="text-gray-400">Rating</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Slider Navigation Dots -->
        <div class="slider-dots">
            <span class="dot active" onclick="currentSlide(1)"></span>
            <span class="dot" onclick="currentSlide(2)"></span>
            <span class="dot" onclick="currentSlide(3)"></span>
            <span class="dot" onclick="currentSlide(4)"></span>
        </div>

        <!-- Scroll Down Indicator -->
        <div class="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center bounce-animation">
            <a href="#packages" class="text-white">
                <i class="fas fa-chevron-down text-2xl"></i>
            </a>
        </div>
    </section>

    <!-- All Packages Section with Images (5 in one row) -->
    <section id="packages" class="py-20 bg-[#1A1A1A]">
        <div class="container mx-auto px-4">
            <h2 class="text-5xl font-bold text-center mb-4 tracking-wider">
                CHOOSE YOUR <span class="text-[#FFD600]">AECOIN PACKAGE</span>
            </h2>
            <p class="text-center text-gray-400 mb-12 orbitron">All packages delivered instantly to your email</p>
            
            <!-- 5 Packages in One Row with Images -->
            <div id="featured-packages" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <!-- Packages will be loaded here by JavaScript with images -->
            </div>
            
            <!-- Special Offer Banner -->
            <div class="mt-12 bg-gradient-to-r from-[#FFD600]/20 to-[#FFA500]/20 rounded-lg p-6 text-center border-2 border-[#FFD600]/50">
                <h3 class="text-3xl font-bold mb-2 tracking-wider">
                    <i class="fas fa-fire text-[#FFD600] mr-2"></i>
                    LIMITED TIME OFFER!
                </h3>
                <p class="text-gray-300 text-lg orbitron">Save up to 11% on all AECOIN packages - Instant delivery guaranteed!</p>
                <p class="text-[#FFD600] font-bold mt-2 text-xl">Offer ends soon! Get yours now!</p>
            </div>
        </div>
    </section>

    <!-- NEW: Gallery Section -->
    <section id="gallery" class="py-20 bg-[#0D0D0D]">
        <div class="container mx-auto px-4">
            <h2 class="text-5xl font-bold text-center mb-4 tracking-wider">
                GTA <span class="text-[#FFD600]">GALLERY</span>
            </h2>
            <p class="text-center text-gray-400 mb-12 orbitron">Experience the world of Grand Theft Auto Online</p>
            
            <!-- Gallery Grid -->
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <!-- Gallery Item 1 -->
                <div class="gallery-item rounded-lg overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1542751110-97427bbecf20?q=80&w=1984&auto=format&fit=crop" 
                         alt="GTA Racing" class="w-full h-full object-cover">
                    <div class="gallery-overlay">
                        <div>
                            <h3 class="text-white font-bold text-lg">Street Racing</h3>
                            <p class="text-gray-300 text-sm">Dominate the streets with AECOIN</p>
                        </div>
                    </div>
                </div>

                <!-- Gallery Item 2 -->
                <div class="gallery-item rounded-lg overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop" 
                         alt="GTA Gaming" class="w-full h-full object-cover">
                    <div class="gallery-overlay">
                        <div>
                            <h3 class="text-white font-bold text-lg">Epic Gaming</h3>
                            <p class="text-gray-300 text-sm">Level up your experience</p>
                        </div>
                    </div>
                </div>

                <!-- Gallery Item 3 -->
                <div class="gallery-item rounded-lg overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop" 
                         alt="GTA Action" class="w-full h-full object-cover">
                    <div class="gallery-overlay">
                        <div>
                            <h3 class="text-white font-bold text-lg">Intense Action</h3>
                            <p class="text-gray-300 text-sm">Gear up for battles</p>
                        </div>
                    </div>
                </div>

                <!-- Gallery Item 4 -->
                <div class="gallery-item rounded-lg overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=2065&auto=format&fit=crop" 
                         alt="GTA Heists" class="w-full h-full object-cover">
                    <div class="gallery-overlay">
                        <div>
                            <h3 class="text-white font-bold text-lg">Big Heists</h3>
                            <p class="text-gray-300 text-sm">Plan the perfect score</p>
                        </div>
                    </div>
                </div>

                <!-- Gallery Item 5 -->
                <div class="gallery-item rounded-lg overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?q=80&w=2071&auto=format&fit=crop" 
                         alt="GTA Cars" class="w-full h-full object-cover">
                    <div class="gallery-overlay">
                        <div>
                            <h3 class="text-white font-bold text-lg">Supercars</h3>
                            <p class="text-gray-300 text-sm">Collect exotic vehicles</p>
                        </div>
                    </div>
                </div>

                <!-- Gallery Item 6 -->
                <div class="gallery-item rounded-lg overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2070&auto=format&fit=crop" 
                         alt="GTA Weapons" class="w-full h-full object-cover">
                    <div class="gallery-overlay">
                        <div>
                            <h3 class="text-white font-bold text-lg">Weapons Arsenal</h3>
                            <p class="text-gray-300 text-sm">Upgrade your firepower</p>
                        </div>
                    </div>
                </div>

                <!-- Gallery Item 7 -->
                <div class="gallery-item rounded-lg overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1586182987320-4f376d39d787?q=80&w=1974&auto=format&fit=crop" 
                         alt="GTA Properties" class="w-full h-full object-cover">
                    <div class="gallery-overlay">
                        <div>
                            <h3 class="text-white font-bold text-lg">Luxury Properties</h3>
                            <p class="text-gray-300 text-sm">Own the best real estate</p>
                        </div>
                    </div>
                </div>

                <!-- Gallery Item 8 -->
                <div class="gallery-item rounded-lg overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?q=80&w=2070&auto=format&fit=crop" 
                         alt="GTA Online" class="w-full h-full object-cover">
                    <div class="gallery-overlay">
                        <div>
                            <h3 class="text-white font-bold text-lg">Online World</h3>
                            <p class="text-gray-300 text-sm">Join millions of players</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Call to Action -->
            <div class="text-center mt-12">
                <p class="text-2xl mb-6 text-gray-300 orbitron">Ready to join the action?</p>
                <a href="#packages" class="bg-[#FFD600] text-black px-12 py-4 rounded-lg font-bold text-xl hover:bg-yellow-400 transition transform hover:scale-105 inline-block uppercase tracking-wider">
                    <i class="fas fa-rocket mr-2"></i>
                    Get Your AECOIN Now!
                </a>
            </div>
        </div>
    </section>

    <!-- How It Works -->
    <section id="how-it-works" class="py-20 bg-[#1A1A1A]">
        <div class="container mx-auto px-4">
            <h2 class="text-5xl font-bold text-center mb-12 tracking-wider">HOW IT <span class="text-[#FFD600]">WORKS</span></h2>
            <div class="grid md:grid-cols-4 gap-8">
                <div class="text-center group">
                    <div class="bg-[#FFD600] text-black w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold group-hover:scale-110 transition">
                        <i class="fas fa-mouse-pointer"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2 uppercase tracking-wider">Choose Package</h3>
                    <p class="text-gray-400">Select your desired AECOIN amount from our packages</p>
                </div>
                <div class="text-center group">
                    <div class="bg-[#FFD600] text-black w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold group-hover:scale-110 transition">
                        <i class="fas fa-credit-card"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2 uppercase tracking-wider">Secure Payment</h3>
                    <p class="text-gray-400">Pay safely via ToyyibPay with FPX or credit card</p>
                </div>
                <div class="text-center group">
                    <div class="bg-[#FFD600] text-black w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold group-hover:scale-110 transition">
                        <i class="fas fa-envelope"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2 uppercase tracking-wider">Instant Delivery</h3>
                    <p class="text-gray-400">Receive activation codes instantly in your email</p>
                </div>
                <div class="text-center group">
                    <div class="bg-[#FFD600] text-black w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold group-hover:scale-110 transition">
                        <i class="fas fa-gamepad"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2 uppercase tracking-wider">Redeem & Play</h3>
                    <p class="text-gray-400">Enter codes in GTA Online and enjoy!</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Features Grid -->
    <section class="py-20 bg-[#0D0D0D]">
        <div class="container mx-auto px-4">
            <div class="grid md:grid-cols-3 gap-8">
                <div class="bg-[#1A1A1A] rounded-lg p-8 text-center border-2 border-gray-800 hover:border-[#FFD600] transition transform hover:scale-105">
                    <i class="fas fa-bolt text-[#FFD600] text-6xl mb-4"></i>
                    <h3 class="text-3xl font-bold mb-3 tracking-wider">INSTANT DELIVERY</h3>
                    <p class="text-gray-400">Codes sent to your email immediately after payment confirmation</p>
                </div>
                <div class="bg-[#1A1A1A] rounded-lg p-8 text-center border-2 border-gray-800 hover:border-[#FFD600] transition transform hover:scale-105">
                    <i class="fas fa-shield-alt text-[#FFD600] text-6xl mb-4"></i>
                    <h3 class="text-3xl font-bold mb-3 tracking-wider">100% SECURE</h3>
                    <p class="text-gray-400">Encrypted payments through trusted Malaysian payment gateways</p>
                </div>
                <div class="bg-[#1A1A1A] rounded-lg p-8 text-center border-2 border-gray-800 hover:border-[#FFD600] transition transform hover:scale-105">
                    <i class="fas fa-headset text-[#FFD600] text-6xl mb-4"></i>
                    <h3 class="text-3xl font-bold mb-3 tracking-wider">24/7 SUPPORT</h3>
                    <p class="text-gray-400">Our support team is always ready to help you with any issues</p>
                </div>
            </div>
        </div>
    </section>

    <!-- FAQ -->
    <section id="faq" class="py-20 bg-[#1A1A1A]">
        <div class="container mx-auto px-4 max-w-3xl">
            <h2 class="text-5xl font-bold text-center mb-12 tracking-wider">FREQUENTLY ASKED <span class="text-[#FFD600]">QUESTIONS</span></h2>
            <div class="space-y-4">
                <div class="bg-[#0D0D0D] rounded-lg p-6 border-2 border-gray-800 hover:border-[#FFD600] transition">
                    <h3 class="text-xl font-bold mb-2 text-[#FFD600] uppercase tracking-wider">
                        <i class="fas fa-clock mr-2"></i>
                        How fast will I receive my codes?
                    </h3>
                    <p class="text-gray-400">Codes are sent instantly to your email after successful payment confirmation.</p>
                </div>
                <div class="bg-[#0D0D0D] rounded-lg p-6 border-2 border-gray-800 hover:border-[#FFD600] transition">
                    <h3 class="text-xl font-bold mb-2 text-[#FFD600] uppercase tracking-wider">
                        <i class="fas fa-shield-alt mr-2"></i>
                        Is it safe to buy from you?
                    </h3>
                    <p class="text-gray-400">Yes! We use secure payment gateways and never store your payment information. All transactions are encrypted.</p>
                </div>
                <div class="bg-[#0D0D0D] rounded-lg p-6 border-2 border-gray-800 hover:border-[#FFD600] transition">
                    <h3 class="text-xl font-bold mb-2 text-[#FFD600] uppercase tracking-wider">
                        <i class="fas fa-credit-card mr-2"></i>
                        What payment methods do you accept?
                    </h3>
                    <p class="text-gray-400">We accept online banking (FPX) and credit/debit cards via ToyyibPay and Billplz.</p>
                </div>
                <div class="bg-[#0D0D0D] rounded-lg p-6 border-2 border-gray-800 hover:border-[#FFD600] transition">
                    <h3 class="text-xl font-bold mb-2 text-[#FFD600] uppercase tracking-wider">
                        <i class="fas fa-undo mr-2"></i>
                        Can I get a refund?
                    </h3>
                    <p class="text-gray-400">Due to the digital nature of our products, refunds are only available for unused codes within 24 hours of purchase.</p>
                </div>
                <div class="bg-[#0D0D0D] rounded-lg p-6 border-2 border-gray-800 hover:border-[#FFD600] transition">
                    <h3 class="text-xl font-bold mb-2 text-[#FFD600] uppercase tracking-wider">
                        <i class="fas fa-gamepad mr-2"></i>
                        How do I redeem the codes?
                    </h3>
                    <p class="text-gray-400">Launch GTA Online, go to the in-game store, select "Redeem Code", enter your activation code, and confirm.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Gaming Style Footer with Character Image -->
    <footer class="relative overflow-hidden bg-[#0D0D0D] border-t-2 border-[#FFD600]/30">
        <div class="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/95 to-transparent"></div>
        
        <!-- Character Image Background -->
        <div class="absolute right-0 bottom-0 w-[600px] h-[400px] opacity-30 character-float">
            <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop" 
                 alt="Gaming Character" 
                 class="w-full h-full object-cover object-center"
                 style="mask-image: linear-gradient(to left, black, transparent); -webkit-mask-image: linear-gradient(to left, black, transparent);">
        </div>
        
        <div class="relative z-10 container mx-auto px-4 py-16">
            <div class="grid md:grid-cols-2 gap-12">
                <!-- Left Side - Company Info -->
                <div>
                    <div class="mb-8">
                        <h3 class="text-4xl font-bold mb-2 tracking-wider">
                            <span class="text-[#FFD600] orbitron">AECOIN</span> STORE
                        </h3>
                        <p class="text-gray-400 mb-4">Company No. 10-261<br>
                        Main Stock Level 5,<br>
                        Jalan Stock Tech Tower,<br>
                        50200 Kuala Lumpur</p>
                        
                        <div class="flex space-x-4 mt-6">
                            <!-- Payment Icons -->
                            <div class="bg-white/10 px-3 py-2 rounded flex items-center space-x-2">
                                <i class="fab fa-cc-visa text-2xl"></i>
                            </div>
                            <div class="bg-white/10 px-3 py-2 rounded flex items-center space-x-2">
                                <i class="fab fa-cc-mastercard text-2xl"></i>
                            </div>
                            <div class="bg-white/10 px-3 py-2 rounded flex items-center space-x-2">
                                <i class="fas fa-university text-2xl"></i>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Get In Touch Button -->
                    <a href="/orders" class="inline-block bg-[#FFD600] text-black px-8 py-3 rounded font-bold hover:bg-yellow-400 transition transform hover:scale-105 uppercase tracking-wider">
                        GET IN TOUCH
                    </a>
                    
                    <p class="text-green-500 mt-4 text-sm uppercase tracking-wider">
                        <i class="fas fa-circle text-xs mr-2"></i>ALL SYSTEMS OPERATIONAL
                    </p>
                </div>
                
                <!-- Right Side - Links -->
                <div class="grid grid-cols-2 gap-8">
                    <div>
                        <h4 class="text-xl font-bold mb-6 uppercase tracking-wider text-[#FFD600]">FOR PLAYERS</h4>
                        <ul class="space-y-3">
                            <li><a href="#" class="text-gray-400 hover:text-[#FFD600] transition uppercase text-sm tracking-wider">User Control Panel</a></li>
                            <li><a href="#" class="text-gray-400 hover:text-[#FFD600] transition uppercase text-sm tracking-wider">Changelog</a></li>
                            <li><a href="#" class="text-gray-400 hover:text-[#FFD600] transition uppercase text-sm tracking-wider">Creators</a></li>
                            <li><a href="#" class="text-gray-400 hover:text-[#FFD600] transition uppercase text-sm tracking-wider">Technical</a></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 class="text-xl font-bold mb-6 uppercase tracking-wider text-[#FFD600]">INFORMATION</h4>
                        <ul class="space-y-3">
                            <li><a href="#" class="text-gray-400 hover:text-[#FFD600] transition uppercase text-sm tracking-wider">Whitelist</a></li>
                            <li><a href="#" class="text-gray-400 hover:text-[#FFD600] transition uppercase text-sm tracking-wider">Gangs</a></li>
                            <li><a href="#" class="text-gray-400 hover:text-[#FFD600] transition uppercase text-sm tracking-wider">Cagori</a></li>
                            <li><a href="/admin" class="text-gray-400 hover:text-[#FFD600] transition uppercase text-sm tracking-wider">Admin</a></li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <!-- Bottom Bar -->
            <div class="mt-12 pt-8 border-t border-gray-800 flex flex-wrap justify-between items-center">
                <div class="flex items-center space-x-2 mb-4 md:mb-0">
                    <i class="fas fa-coins text-[#FFD600] text-2xl"></i>
                    <span class="text-gray-400 text-sm uppercase tracking-wider">© 2024 AECOIN Store</span>
                </div>
                
                <p class="text-gray-500 text-xs">
                    Your trusted source for GTA Online virtual currency. Fast, secure, and reliable.
                </p>
                
                <div class="flex space-x-4 text-xs text-gray-500 mt-4 md:mt-0">
                    <a href="#" class="hover:text-[#FFD600] transition">Terms & Conditions</a>
                    <a href="#" class="hover:text-[#FFD600] transition">Privacy Policy</a>
                    <a href="#" class="hover:text-[#FFD600] transition">Refund Policy</a>
                </div>
            </div>
        </div>
    </footer>

    <!-- Cart Drawer -->
    <div id="cart-drawer" class="fixed right-0 top-0 h-full w-96 bg-[#1A1A1A] transform translate-x-full transition-transform z-50 shadow-2xl">
        <div class="p-6 h-full flex flex-col">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold uppercase tracking-wider">Shopping Cart</h2>
                <button onclick="closeCart()" class="text-gray-400 hover:text-white transition">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            <div id="cart-items" class="flex-1 overflow-y-auto space-y-4">
                <!-- Cart items will be loaded here -->
            </div>
            <div class="mt-6 pt-6 border-t border-gray-700">
                <div class="flex justify-between mb-4">
                    <span class="text-xl uppercase tracking-wider">Total:</span>
                    <span id="cart-total" class="text-xl font-bold text-[#FFD600] orbitron">RM 0.00</span>
                </div>
                <a href="/checkout" class="block bg-[#FFD600] text-black text-center py-3 rounded-lg font-bold hover:bg-yellow-400 transition uppercase tracking-wider">
                    <i class="fas fa-lock mr-2"></i>
                    Proceed to Checkout
                </a>
            </div>
        </div>
    </div>

    <script src="/static/js/app.js"></script>
    <script>
        // Hero Slider
        let slideIndex = 1;
        let slideInterval;

        function currentSlide(n) {
            showSlide(slideIndex = n);
            resetInterval();
        }

        function showSlide(n) {
            let slides = document.getElementsByClassName("slide");
            let dots = document.getElementsByClassName("dot");
            
            if (n > slides.length) { slideIndex = 1 }
            if (n < 1) { slideIndex = slides.length }
            
            for (let i = 0; i < slides.length; i++) {
                slides[i].classList.remove("active");
            }
            
            for (let i = 0; i < dots.length; i++) {
                dots[i].classList.remove("active");
            }
            
            slides[slideIndex - 1].classList.add("active");
            dots[slideIndex - 1].classList.add("active");
        }

        function nextSlide() {
            showSlide(slideIndex += 1);
        }

        function resetInterval() {
            clearInterval(slideInterval);
            slideInterval = setInterval(nextSlide, 5000);
        }

        // Start auto-slide
        resetInterval();

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    </script>
</body>
</html>
  `);
}