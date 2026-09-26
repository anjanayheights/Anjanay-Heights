export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-12 gap-8 mb-12">
          <div className="md:col-span-5">
            <a href="#" className="inline-block mb-4">
              <span className="font-serif font-bold text-2xl tracking-tight text-[#1A365D]">
                ANJANAY <span className="text-[#C2A36B]">HEIGHTS</span>
              </span>
            </a>
            <p className="text-xs text-gray-500 leading-relaxed max-w-sm mb-6">
              Your trusted destination for premium residential and commercial properties in Central Noida, Noida Extension, Greater Noida, and Greater Noida West.
            </p>
            <a href="mailto:anjanayheights@gmail.com" className="text-[10px] font-bold uppercase tracking-widest text-[#1A365D] hover:text-[#C2A36B]">anjanayheights@gmail.com</a>
          </div>
          <div className="md:col-span-3 md:col-start-7">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#1A365D] mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li><a href="#home" className="text-xs text-gray-500 hover:text-[#C2A36B] transition-colors">Home</a></li>
              <li><a href="#about" className="text-xs text-gray-500 hover:text-[#C2A36B] transition-colors">About Us</a></li>
              <li><a href="#properties" className="text-xs text-gray-500 hover:text-[#C2A36B] transition-colors">Residential Properties</a></li>
              <li><a href="#properties" className="text-xs text-gray-500 hover:text-[#C2A36B] transition-colors">Commercial Investments</a></li>
              <li><a href="#properties" className="text-xs text-gray-500 hover:text-[#C2A36B] transition-colors">Hospital Projects</a></li>
            </ul>
          </div>
          <div className="md:col-span-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#1A365D] mb-6">Legal</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-xs text-gray-500 hover:text-[#C2A36B] transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-xs text-gray-500 hover:text-[#C2A36B] transition-colors">Terms & Conditions</a></li>
              <li><a href="#" className="text-xs text-gray-500 hover:text-[#C2A36B] transition-colors">Disclaimer</a></li>
              <li><a href="#contact" className="text-xs text-gray-500 hover:text-[#C2A36B] transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100 bg-[#F9F9F7] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">© 2026 Anjanay Heights</p>
          <div className="flex space-x-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <a href="#" className="hover:text-[#C2A36B]">Facebook</a>
            <a href="#" className="hover:text-[#C2A36B]">Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  );
}