import Link from "next/link";
import {
  Car,
  Wrench,
  MapPin,
  Shield,
  Zap,
  Clock,
  ChevronRight,
  Star,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <Wrench className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Road Rescue</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm rounded-lg bg-orange-500 hover:bg-orange-400 text-white font-medium transition-colors"
          >
            Join Now
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center">
        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-2/3 left-1/4 w-[300px] h-[300px] bg-blue-500/8 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            Mechanics dispatched in under 5 minutes
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
            Stuck on the road?{" "}
            <span className="text-orange-400">We&apos;ve got you.</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/60 max-w-xl mx-auto mb-10 leading-relaxed">
            One tap. Your location. A mechanic on the way. Road Rescue connects
            drivers in emergencies with certified mechanics in real time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/register"
              className="group flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold text-lg transition-all duration-200 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02]"
            >
              Get Help Now
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-xl border border-white/10 hover:border-white/20 text-white/80 hover:text-white font-medium text-lg transition-all duration-200 hover:bg-white/5"
            >
              Mechanic Login
            </Link>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-white/40">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-green-400" />
              Verified mechanics
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-400" />
              24/7 availability
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-orange-400" />
              Live GPS tracking
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-yellow-400" />
              Rated 4.9 / 5
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-24 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Help in 3 simple steps
          </h2>
          <p className="text-white/50 max-w-md mx-auto">
            From breakdown to back on the road — no phone calls, no waiting music.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: MapPin,
              step: "01",
              title: "Share Your Location",
              desc: "Tap once for auto-detection or pin your exact position on the map.",
              color: "text-orange-400",
              bg: "bg-orange-500/10 border-orange-500/20",
            },
            {
              icon: Car,
              step: "02",
              title: "Describe the Issue",
              desc: "Select your problem type and add any details. Flat tyre? Dead battery? We handle it all.",
              color: "text-blue-400",
              bg: "bg-blue-500/10 border-blue-500/20",
            },
            {
              icon: Wrench,
              step: "03",
              title: "Mechanic On The Way",
              desc: "A nearby certified mechanic accepts your request and heads to you — live tracked.",
              color: "text-green-400",
              bg: "bg-green-500/10 border-green-500/20",
            },
          ].map(({ icon: Icon, step, title, desc, color, bg }) => (
            <div key={step} className="glass rounded-2xl p-6 border hover:border-white/15 transition-colors">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl border ${bg} mb-4`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className="text-xs font-mono text-white/30 mb-2">STEP {step}</div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features bento grid */}
      <section className="px-6 py-12 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Built for emergencies
          </h2>
          <p className="text-white/50 max-w-md mx-auto">
            Every feature designed for clarity and speed when you need it most.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: Zap, title: "Instant Dispatch", desc: "Mechanics see your request the moment you submit it — no delays.", span: "lg:col-span-2" },
            { icon: MapPin, title: "Live Map Tracking", desc: "Watch your mechanic's route in real time on a live map.", span: "" },
            { icon: Shield, title: "Verified Mechanics", desc: "Every mechanic is background-checked and certified.", span: "" },
            { icon: Clock, title: "Status Updates", desc: "Automatic notifications at every step: Accepted → On the Way → Done.", span: "lg:col-span-2" },
            { icon: Car, title: "All Issue Types", desc: "Flat tyres, dead batteries, fuel, overheating, lockouts, and more.", span: "" },
          ].map(({ icon: Icon, title, desc, span }) => (
            <div key={title} className={`glass rounded-2xl p-6 border border-white/8 hover:border-white/15 transition-colors ${span}`}>
              <Icon className="w-5 h-5 text-orange-400 mb-3" />
              <h3 className="font-semibold mb-1.5">{title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="max-w-2xl mx-auto text-center glass rounded-3xl p-10 border border-orange-500/10">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-6">
            <Wrench className="w-6 h-6 text-orange-400" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Are you a mechanic?
          </h2>
          <p className="text-white/50 mb-8 max-w-md mx-auto">
            Join the Road Rescue network. Get notified of jobs near you and earn
            on your own schedule.
          </p>
          <Link
            href="/register?role=MECHANIC"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-black font-semibold hover:bg-white/90 transition-colors"
          >
            Join as Mechanic
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8 text-center text-white/30 text-sm">
        <p>
          &copy; {new Date().getFullYear()} Road Rescue. Built for the road, ready for anything.
        </p>
      </footer>
    </div>
  );
}
