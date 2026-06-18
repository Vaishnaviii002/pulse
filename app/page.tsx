// import {
//   ArrowRight,
//   BrainCircuit,
//   CalendarDays,
//   CheckCircle2,
//   Clock3,
//   GraduationCap,
//   Mail,
//   MessageSquareText,
//   ShieldCheck,
//   Sparkles,
//   UsersRound,
//   Workflow,
//   Zap,
// } from "lucide-react";

// const navItems = [
//   { label: "Why pulse", href: "#why" },
//   { label: "pulse AI", href: "#pulse-ai" },
//   { label: "Different", href: "#different" },
//   { label: "Use cases", href: "#use-cases" },
//   { label: "Control", href: "#control" },
// ];

// const productCards = [
//   {
//     title: "pulse AI",
//     image: "/landing/pulse-ai.png",
//     text: "Ask questions, summarize work, prepare replies, and get next actions.",
//   },
//   {
//     title: "Inbox",
//     image: "/landing/inbox.png",
//     text: "Understand important Gmail messages and act faster.",
//   },
//   {
//     title: "Calendar",
//     image: "/landing/calendar.png",
//     text: "See meetings and planned actions in one clean view.",
//   },
//   {
//     title: "Meetings",
//     image: "/landing/meetings.png",
//     text: "Prepare agendas, notes, source context, and follow-ups.",
//   },
//   {
//     title: "Tasks",
//     image: "/landing/tasks.png",
//     text: "Track forms, interviews, assessments, and deadlines.",
//   },
// ];

// const whyItems = [
//   {
//     icon: Mail,
//     title: "Understand faster",
//     text: "Summarize emails and detect what needs attention.",
//   },
//   {
//     icon: CalendarDays,
//     title: "Plan smarter",
//     text: "Create meetings and manage your day easily.",
//   },
//   {
//     icon: Workflow,
//     title: "Stay on top",
//     text: "Turn important emails into tasks and follow-ups.",
//   },
//   {
//     icon: ShieldCheck,
//     title: "Act safely",
//     text: "AI drafts and suggests. You approve every real action.",
//   },
// ];

// const differentItems = [
//   {
//     icon: Mail,
//     title: "Not a Gmail clone",
//     text: "Works on top of Gmail with AI intelligence.",
//   },
//   {
//     icon: CalendarDays,
//     title: "Not a Calendar clone",
//     text: "Adds workflow and meeting intelligence.",
//   },
//   {
//     icon: BrainCircuit,
//     title: "Not just a chatbot",
//     text: "Takes context and creates useful next steps.",
//   },
//   {
//     icon: Zap,
//     title: "Action-oriented",
//     text: "Moves from insight to real approved action.",
//   },
//   {
//     icon: ShieldCheck,
//     title: "Approval first",
//     text: "You review everything before pulse acts.",
//   },
//   {
//     icon: UsersRound,
//     title: "For everyone",
//     text: "Useful for students, professionals, and teams.",
//   },
// ];

// const useCases = [
//   {
//     icon: GraduationCap,
//     title: "For Students",
//     points: [
//       "Manage assignments",
//       "Track deadlines",
//       "Prepare for interviews",
//       "Handle placement updates",
//     ],
//   },
//   {
//     icon: Clock3,
//     title: "For Professionals",
//     points: [
//       "Handle email and meetings",
//       "Stay focused",
//       "Draft replies",
//       "Follow up on time",
//     ],
//   },
//   {
//     icon: UsersRound,
//     title: "For Teams",
//     points: [
//       "Shared visibility",
//       "Better collaboration",
//       "Aligned tasks",
//       "Faster communication",
//     ],
//   },
// ];

// export default function LandingPage() {
//   return (
//     <main
//       id="top"
//       className="min-h-screen overflow-hidden bg-[#f8fbfa] text-slate-950"
//     >
//       <style>{`
//         html {
//           scroll-behavior: smooth;
//         }

//         @keyframes fadeUp {
//           from {
//             opacity: 0;
//             transform: translateY(22px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }

//         @keyframes floatSoft {
//           0%, 100% {
//             transform: translateY(0px);
//           }
//           50% {
//             transform: translateY(-10px);
//           }
//         }

//         @keyframes glowPulse {
//           0%, 100% {
//             opacity: 0.45;
//             transform: scale(1);
//           }
//           50% {
//             opacity: 0.85;
//             transform: scale(1.08);
//           }
//         }

//         @keyframes shineMove {
//           from {
//             transform: translateX(-130%);
//           }
//           to {
//             transform: translateX(230%);
//           }
//         }

//         .fade-up {
//           animation: fadeUp 0.75s ease both;
//         }

//         .float-soft {
//           animation: floatSoft 5s ease-in-out infinite;
//         }

//         .glow-pulse {
//           animation: glowPulse 5s ease-in-out infinite;
//         }

//         .shine-card {
//           position: relative;
//           overflow: hidden;
//         }

//         .shine-card::after {
//           content: "";
//           position: absolute;
//           inset: 0;
//           width: 36%;
//           pointer-events: none;
//           background: linear-gradient(
//             90deg,
//             transparent,
//             rgba(255, 255, 255, 0.65),
//             transparent
//           );
//           animation: shineMove 5.5s ease-in-out infinite;
//         }
//       `}</style>

//       <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
//         <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
//           <a href="#top" className="flex items-center gap-2">
//             <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
//               <Zap className="h-4 w-4" />
//             </div>
//             <span className="text-xl font-semibold tracking-tight">pulse</span>
//           </a>

//           <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
//             {navItems.map((item) => (
//               <a
//                 key={item.href}
//                 href={item.href}
//                 className="transition hover:text-emerald-700"
//               >
//                 {item.label}
//               </a>
//             ))}
//           </nav>

//           <a
//             href="#why"
//             className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-800"
//           >
//             Explore
//             <ArrowRight className="h-4 w-4" />
//           </a>
//         </div>
//       </header>

//       <section className="relative mx-auto max-w-7xl px-5 pb-16 pt-16 md:pt-20">
//         <div className="absolute left-0 top-12 h-72 w-72 rounded-full bg-emerald-200 blur-3xl glow-pulse" />
//         <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-teal-100 blur-3xl glow-pulse" />

//         <div className="relative grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
//           <div className="fade-up">
//             <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
//               <Sparkles className="h-3.5 w-3.5" />
//               AI workflow layer for Gmail & Calendar
//             </div>

//             <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 md:text-6xl">
//               One place for email, meetings, tasks and{" "}
//               <span className="text-emerald-700">AI actions.</span>
//             </h1>

//             <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 md:text-base">
//               pulse connects with your real Gmail and Google Calendar to help
//               you understand, plan, and act — with your approval.
//             </p>

//             <div className="mt-8 flex flex-wrap items-center gap-3">
//               <a
//                 href="#pulse-ai"
//                 className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/10 transition hover:-translate-y-0.5 hover:bg-emerald-800"
//               >
//                 See pulse AI
//                 <ArrowRight className="h-4 w-4" />
//               </a>

//               <a
//                 href="#why"
//                 className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-semibold text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50"
//               >
//                 See how it works
//                 <ArrowRight className="h-4 w-4 rotate-90" />
//               </a>
//             </div>

//             <div className="mt-8 grid max-w-xl grid-cols-2 gap-3 text-xs text-slate-600 sm:grid-cols-4">
//               <MiniTrust text="Gmail & Calendar" />
//               <MiniTrust text="AI Copilot" />
//               <MiniTrust text="User Approved" />
//               <MiniTrust text="For work & study" />
//             </div>
//           </div>

//           <div className="relative float-soft">
//             <div className="shine-card rounded-[2rem] border border-slate-200 bg-white p-2 shadow-2xl shadow-emerald-950/10">
//               <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-100">
//                 <img
//                   src="/landing/pulse-ai.png"
//                   alt="pulse AI real project screenshot"
//                   className="h-[420px] w-full object-cover object-top"
//                 />
//               </div>
//             </div>

//             <div className="pointer-events-none absolute -bottom-8 left-1/2 h-24 w-[80%] -translate-x-1/2 rounded-full bg-emerald-200/80 blur-3xl" />
//           </div>
//         </div>
//       </section>

//       <section id="why" className="scroll-mt-24 px-5 py-16">
//         <div className="mx-auto max-w-7xl">
//           <div className="mx-auto max-w-2xl text-center">
//             <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
//               Why pulse?
//             </p>

//             <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
//               Because your time deserves better.
//             </h2>

//             <p className="mt-3 text-sm leading-6 text-slate-600">
//               Most of your day goes into reading, switching tabs, and
//               remembering. pulse brings everything together and helps you focus
//               on what matters.
//             </p>
//           </div>

//           <div className="mt-10 grid gap-5 md:grid-cols-4">
//             {whyItems.map((item) => (
//               <div
//                 key={item.title}
//                 className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-950/5"
//               >
//                 <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
//                   <item.icon className="h-5 w-5" />
//                 </div>

//                 <h3 className="mt-4 text-sm font-semibold text-slate-950">
//                   {item.title}
//                 </h3>

//                 <p className="mt-2 text-sm leading-6 text-slate-600">
//                   {item.text}
//                 </p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       <section className="border-y border-slate-200 bg-white px-5 py-16">
//         <div className="mx-auto max-w-7xl">
//           <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
//             <div>
//               <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
//                 Your work, in one intelligent workspace
//               </p>

//               <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
//                 Simple views. Real project context.
//               </h2>
//             </div>

//             <div className="flex flex-wrap gap-2 text-xs">
//               {["pulse AI", "Inbox", "Calendar", "Meetings", "Tasks"].map(
//                 (item) => (
//                   <a
//                     key={item}
//                     href="#pulse-ai"
//                     className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 font-medium text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
//                   >
//                     {item}
//                   </a>
//                 )
//               )}
//             </div>
//           </div>

//           <div className="grid gap-5 md:grid-cols-5">
//             {productCards.map((card) => (
//               <div
//                 key={card.title}
//                 className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-950/5"
//               >
//                 <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
//                   <img
//                     src={card.image}
//                     alt={`${card.title} screenshot`}
//                     className="h-44 w-full object-cover object-top"
//                   />
//                 </div>

//                 <div className="px-1 py-4">
//                   <h3 className="text-sm font-semibold text-slate-950">
//                     {card.title}
//                   </h3>

//                   <p className="mt-2 text-xs leading-5 text-slate-600">
//                     {card.text}
//                   </p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       <section id="pulse-ai" className="scroll-mt-24 px-5 py-20">
//         <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
//           <div className="relative">
//             <div className="mx-auto flex h-72 w-72 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 shadow-2xl shadow-emerald-950/10">
//               <div className="flex h-28 w-28 items-center justify-center rounded-full bg-emerald-700 text-white shadow-xl shadow-emerald-900/20">
//                 <Zap className="h-10 w-10" />
//               </div>

//               <FloatingIcon className="left-5 top-8" icon={<Mail />} />
//               <FloatingIcon className="right-4 top-10" icon={<CalendarDays />} />
//               <FloatingIcon className="bottom-8 left-10" icon={<Workflow />} />
//               <FloatingIcon
//                 className="bottom-7 right-12"
//                 icon={<UsersRound />}
//               />
//             </div>
//           </div>

//           <div>
//             <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
//               pulse AI
//             </p>

//             <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
//               AI that understands your context, not just your questions.
//             </h2>

//             <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
//               pulse AI works with your email, calendar, meetings, and tasks. It
//               understands what is going on and helps you move forward.
//             </p>

//             <div className="mt-6 grid gap-3">
//               {[
//                 "Summarize emails and threads",
//                 "Draft professional replies",
//                 "Create meetings with context",
//                 "Extract tasks and deadlines",
//                 "Prepare meeting notes and follow-ups",
//                 "Always require your approval for real actions",
//               ].map((item) => (
//                 <div key={item} className="flex items-center gap-3 text-sm">
//                   <CheckCircle2 className="h-4 w-4 text-emerald-700" />
//                   <span className="text-slate-700">{item}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </section>

//       <section
//         id="different"
//         className="scroll-mt-24 border-y border-slate-200 bg-white px-5 py-14"
//       >
//         <div className="mx-auto max-w-7xl">
//           <div className="mx-auto max-w-2xl text-center">
//             <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
//               Why pulse is different
//             </p>

//             <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
//               It is built for actions, not just answers.
//             </h2>
//           </div>

//           <div className="mt-10 grid gap-5 md:grid-cols-3 lg:grid-cols-6">
//             {differentItems.map((item) => (
//               <div
//                 key={item.title}
//                 className="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-950/5"
//               >
//                 <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
//                   <item.icon className="h-5 w-5" />
//                 </div>

//                 <h3 className="mt-4 text-xs font-semibold text-slate-950">
//                   {item.title}
//                 </h3>

//                 <p className="mt-2 text-xs leading-5 text-slate-600">
//                   {item.text}
//                 </p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       <section id="use-cases" className="scroll-mt-24 px-5 py-20">
//         <div className="mx-auto max-w-7xl">
//           <div className="mx-auto max-w-2xl text-center">
//             <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
//               Built for students, professionals & teams
//             </p>

//             <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
//               One assistant for different kinds of work.
//             </h2>
//           </div>

//           <div className="mt-10 grid gap-6 md:grid-cols-3">
//             {useCases.map((item) => (
//               <div
//                 key={item.title}
//                 className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-950/5"
//               >
//                 <div className="flex h-40 items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
//                   <item.icon className="h-16 w-16 text-emerald-700" />
//                 </div>

//                 <div className="p-6">
//                   <h3 className="text-base font-semibold text-emerald-700">
//                     {item.title}
//                   </h3>

//                   <ul className="mt-4 space-y-2">
//                     {item.points.map((point) => (
//                       <li
//                         key={point}
//                         className="flex items-center gap-2 text-sm text-slate-600"
//                       >
//                         <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
//                         {point}
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       <section id="control" className="scroll-mt-24 px-5 pb-20">
//         <div className="mx-auto max-w-7xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5 md:p-8">
//           <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
//             <div className="flex items-start gap-4">
//               <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
//                 <ShieldCheck className="h-7 w-7" />
//               </div>

//               <div>
//                 <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
//                   You are always in control.
//                 </h2>

//                 <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600">
//                   pulse AI suggests and prepares. You review, approve, and
//                   decide what happens next.
//                 </p>
//               </div>
//             </div>

//             <div className="grid gap-3 md:grid-cols-4">
//               <StepCard title="AI suggests" text="Analyzes context" />
//               <StepCard title="You review" text="Check and edit" />
//               <StepCard title="You approve" text="Confirm action" />
//               <StepCard title="Action taken" text="With your approval" />
//             </div>
//           </div>
//         </div>
//       </section>

//       <footer className="border-t border-slate-200 bg-white">
//         <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
//           <p>© 2026 pulse. AI workflow layer for Gmail and Calendar.</p>

//           <div className="flex flex-wrap items-center gap-4">
//             <a href="#why" className="hover:text-emerald-700">
//               Why pulse
//             </a>
//             <a href="#pulse-ai" className="hover:text-emerald-700">
//               pulse AI
//             </a>
//             <a href="#different" className="hover:text-emerald-700">
//               Different
//             </a>
//             <a href="#top" className="hover:text-emerald-700">
//               Back to top
//             </a>
//           </div>
//         </div>
//       </footer>
//     </main>
//   );
// }

// function MiniTrust({ text }: { text: string }) {
//   return (
//     <div className="flex items-center gap-2">
//       <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
//       <span>{text}</span>
//     </div>
//   );
// }

// function FloatingIcon({
//   icon,
//   className,
// }: {
//   icon: React.ReactNode;
//   className: string;
// }) {
//   return (
//     <div
//       className={[
//         "absolute flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-700 shadow-lg shadow-emerald-950/10",
//         className,
//       ].join(" ")}
//     >
//       <div className="h-5 w-5">{icon}</div>
//     </div>
//   );
// }

// function StepCard({ title, text }: { title: string; text: string }) {
//   return (
//     <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
//       <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
//         <CheckCircle2 className="h-4 w-4" />
//       </div>

//       <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
//       <p className="mt-1 text-xs text-slate-500">{text}</p>
//     </div>
//   );
// }





























// "use client";

// import type { ReactNode } from "react";
// import { useRouter } from "next/navigation";
// import {
//   ArrowRight,
//   BrainCircuit,
//   CalendarDays,
//   CheckCircle2,
//   Clock3,
//   GraduationCap,
//   Mail,
//   ShieldCheck,
//   Sparkles,
//   UsersRound,
//   Workflow,
//   Zap,
// } from "lucide-react";

// const navItems = [
//   { label: "Why pulse", id: "why" },
//   { label: "pulse AI", id: "pulse-ai" },
//   { label: "Screenshots", id: "screenshots" },
//   { label: "Different", id: "different" },
//   { label: "Use cases", id: "use-cases" },
//   { label: "Control", id: "control" },
// ];

// const productCards = [
//   {
//     title: "pulse AI",
//     image: "/landing/pulse-ai.png",
//     text: "Ask questions, summarize work, prepare replies, and get next actions from real Gmail and Calendar context.",
//   },
//   {
//     title: "Inbox",
//     image: "/landing/inbox.png",
//     text: "Read Gmail messages, understand important context, and move from email to action faster.",
//   },
//   {
//     title: "Calendar",
//     image: "/landing/calendar.png",
//     text: "View your weekly calendar, meetings, and planned actions in one clean workspace.",
//   },
//   {
//     title: "Meetings",
//     image: "/landing/meetings.png",
//     text: "Prepare agendas, notes, source email context, meeting readiness, and follow-ups.",
//   },
//   {
//     title: "Tasks",
//     image: "/landing/tasks.png",
//     text: "Track forms, interviews, assessments, follow-ups, and deadlines extracted from Gmail.",
//   },
// ];

// const whyItems = [
//   {
//     icon: Mail,
//     title: "Understand faster",
//     text: "Summarize emails and detect what needs attention.",
//   },
//   {
//     icon: CalendarDays,
//     title: "Plan smarter",
//     text: "Create meetings and manage your day easily.",
//   },
//   {
//     icon: Workflow,
//     title: "Stay on top",
//     text: "Turn important emails into tasks and follow-ups.",
//   },
//   {
//     icon: ShieldCheck,
//     title: "Act safely",
//     text: "AI drafts and suggests. You approve every real action.",
//   },
// ];

// const differentItems = [
//   {
//     icon: Mail,
//     title: "Not a Gmail clone",
//     text: "Works on top of Gmail with AI intelligence.",
//   },
//   {
//     icon: CalendarDays,
//     title: "Not a Calendar clone",
//     text: "Adds workflow and meeting intelligence.",
//   },
//   {
//     icon: BrainCircuit,
//     title: "Not just a chatbot",
//     text: "Takes context and creates useful next steps.",
//   },
//   {
//     icon: Zap,
//     title: "Action-oriented",
//     text: "Moves from insight to real approved action.",
//   },
//   {
//     icon: ShieldCheck,
//     title: "Approval first",
//     text: "You review everything before pulse acts.",
//   },
//   {
//     icon: UsersRound,
//     title: "For everyone",
//     text: "Useful for students, professionals, and teams.",
//   },
// ];

// const useCases = [
//   {
//     icon: GraduationCap,
//     title: "For Students",
//     points: [
//       "Manage assignments",
//       "Track deadlines",
//       "Prepare for interviews",
//       "Handle placement updates",
//     ],
//   },
//   {
//     icon: Clock3,
//     title: "For Professionals",
//     points: [
//       "Handle email and meetings",
//       "Stay focused",
//       "Draft replies",
//       "Follow up on time",
//     ],
//   },
//   {
//     icon: UsersRound,
//     title: "For Teams",
//     points: [
//       "Shared visibility",
//       "Better collaboration",
//       "Aligned tasks",
//       "Faster communication",
//     ],
//   },
// ];

// export default function LandingPage() {
//   const router = useRouter();

//   function scrollToSection(id: string) {
//     const element = document.getElementById(id);

//     if (element) {
//       element.scrollIntoView({
//         behavior: "smooth",
//         block: "start",
//       });
//     }
//   }

//   function goToSignup() {
//     router.push("/sign-up");
//   }

//   return (
//     <main
//       id="top"
//       className="min-h-screen overflow-hidden bg-[#f8fbfa] text-slate-950"
//     >
//       <style>{`
//         html {
//           scroll-behavior: smooth;
//         }

//         @keyframes fadeUp {
//           from {
//             opacity: 0;
//             transform: translateY(22px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }

//         @keyframes floatSoft {
//           0%, 100% {
//             transform: translateY(0px);
//           }
//           50% {
//             transform: translateY(-10px);
//           }
//         }

//         @keyframes glowPulse {
//           0%, 100% {
//             opacity: 0.45;
//             transform: scale(1);
//           }
//           50% {
//             opacity: 0.85;
//             transform: scale(1.08);
//           }
//         }

//         @keyframes shineMove {
//           from {
//             transform: translateX(-130%);
//           }
//           to {
//             transform: translateX(230%);
//           }
//         }

//         .fade-up {
//           animation: fadeUp 0.75s ease both;
//         }

//         .float-soft {
//           animation: floatSoft 5s ease-in-out infinite;
//         }

//         .glow-pulse {
//           animation: glowPulse 5s ease-in-out infinite;
//         }

//         .shine-card {
//           position: relative;
//           overflow: hidden;
//         }

//         .shine-card::after {
//           content: "";
//           position: absolute;
//           inset: 0;
//           width: 36%;
//           pointer-events: none;
//           background: linear-gradient(
//             90deg,
//             transparent,
//             rgba(255, 255, 255, 0.65),
//             transparent
//           );
//           animation: shineMove 5.5s ease-in-out infinite;
//         }
//       `}</style>

//       <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
//         <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
//           <button
//             type="button"
//             onClick={() => scrollToSection("top")}
//             className="flex items-center gap-2"
//           >
//             <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
//               <Zap className="h-4 w-4" />
//             </div>
//             <span className="text-xl font-semibold tracking-tight">pulse</span>
//           </button>

//           <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
//             {navItems.map((item) => (
//               <button
//                 key={item.id}
//                 type="button"
//                 onClick={() => scrollToSection(item.id)}
//                 className="transition hover:text-emerald-700"
//               >
//                 {item.label}
//               </button>
//             ))}
//           </nav>

//           <div className="flex items-center gap-2">
//             <button
//               type="button"
//               onClick={goToSignup}
//               className="hidden rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50 sm:inline-flex"
//             >
//               Sign up
//             </button>

//             <button
//               type="button"
//               onClick={goToSignup}
//               className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-800"
//             >
//               Get started
//               <ArrowRight className="h-4 w-4" />
//             </button>
//           </div>
//         </div>
//       </header>

//       <section className="relative mx-auto max-w-7xl px-5 pb-16 pt-16 md:pt-20">
//         <div className="absolute left-0 top-12 h-72 w-72 rounded-full bg-emerald-200 blur-3xl glow-pulse" />
//         <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-teal-100 blur-3xl glow-pulse" />

//         <div className="relative grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
//           <div className="fade-up">
//             <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
//               <Sparkles className="h-3.5 w-3.5" />
//               AI workflow layer for Gmail & Calendar
//             </div>

//             <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 md:text-6xl">
//               One place for email, meetings, tasks and{" "}
//               <span className="text-emerald-700">AI actions.</span>
//             </h1>

//             <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 md:text-base">
//               pulse connects with your real Gmail and Google Calendar to help
//               you understand, plan, and act — with your approval.
//             </p>

//             <div className="mt-8 flex flex-wrap items-center gap-3">
//               <button
//                 type="button"
//                 onClick={goToSignup}
//                 className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/10 transition hover:-translate-y-0.5 hover:bg-emerald-800"
//               >
//                 Get started
//                 <ArrowRight className="h-4 w-4" />
//               </button>

//               <button
//                 type="button"
//                 onClick={goToSignup}
//                 className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-semibold text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50"
//               >
//                 Sign up
//                 <ArrowRight className="h-4 w-4" />
//               </button>

//               <button
//                 type="button"
//                 onClick={() => scrollToSection("screenshots")}
//                 className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
//               >
//                 View real screenshots
//                 <ArrowRight className="h-4 w-4 rotate-90" />
//               </button>
//             </div>

//             <div className="mt-8 grid max-w-xl grid-cols-2 gap-3 text-xs text-slate-600 sm:grid-cols-4">
//               <MiniTrust text="Gmail & Calendar" />
//               <MiniTrust text="AI Copilot" />
//               <MiniTrust text="User Approved" />
//               <MiniTrust text="For work & study" />
//             </div>
//           </div>

//           <div className="relative float-soft">
//             <div className="shine-card rounded-[2rem] border border-slate-200 bg-white p-2 shadow-2xl shadow-emerald-950/10">
//               <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-100">
//                 <img
//                   src="/landing/pulse-ai.png"
//                   alt="pulse AI project screenshot"
//                   className="h-[420px] w-full object-cover object-top"
//                 />
//               </div>
//             </div>

//             <div className="pointer-events-none absolute -bottom-8 left-1/2 h-24 w-[80%] -translate-x-1/2 rounded-full bg-emerald-200/80 blur-3xl" />
//           </div>
//         </div>
//       </section>

//       <section id="why" className="scroll-mt-24 px-5 py-16">
//         <div className="mx-auto max-w-7xl">
//           <div className="mx-auto max-w-2xl text-center">
//             <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
//               Why pulse?
//             </p>

//             <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
//               Because your time deserves better.
//             </h2>

//             <p className="mt-3 text-sm leading-6 text-slate-600">
//               Most of your day goes into reading, switching tabs, and
//               remembering. pulse brings everything together and helps you focus
//               on what matters.
//             </p>
//           </div>

//           <div className="mt-10 grid gap-5 md:grid-cols-4">
//             {whyItems.map((item) => (
//               <div
//                 key={item.title}
//                 className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-950/5"
//               >
//                 <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
//                   <item.icon className="h-5 w-5" />
//                 </div>

//                 <h3 className="mt-4 text-sm font-semibold text-slate-950">
//                   {item.title}
//                 </h3>

//                 <p className="mt-2 text-sm leading-6 text-slate-600">
//                   {item.text}
//                 </p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       <section
//         id="screenshots"
//         className="scroll-mt-24 border-y border-slate-200 bg-white px-5 py-16"
//       >
//         <div className="mx-auto max-w-7xl">
//           <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
//             <div>
//               <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
//                 Real project screenshots
//               </p>

//               <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
//                 See the actual pulse workspace.
//               </h2>

//               <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
//                 These sections use your real project images from the public
//                 landing folder, including pulse AI, Inbox, Calendar, Meetings,
//                 and Tasks.
//               </p>
//             </div>

//             <button
//               type="button"
//               onClick={goToSignup}
//               className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-800"
//             >
//               Try pulse
//               <ArrowRight className="h-4 w-4" />
//             </button>
//           </div>

//           <div className="grid gap-5 md:grid-cols-5">
//             {productCards.map((card) => (
//               <div
//                 key={card.title}
//                 className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-950/5"
//               >
//                 <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
//                   <img
//                     src={card.image}
//                     alt={`${card.title} screenshot`}
//                     className="h-44 w-full object-cover object-top"
//                   />
//                 </div>

//                 <div className="px-1 py-4">
//                   <h3 className="text-sm font-semibold text-slate-950">
//                     {card.title}
//                   </h3>

//                   <p className="mt-2 text-xs leading-5 text-slate-600">
//                     {card.text}
//                   </p>
//                 </div>
//               </div>
//             ))}
//           </div>

//           <div className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-100 p-2 shadow-xl shadow-slate-950/5">
//             <img
//               src="/landing/inbox.png"
//               alt="pulse inbox full screenshot"
//               className="h-[520px] w-full rounded-[1.5rem] object-cover object-top"
//             />
//           </div>
//         </div>
//       </section>

//       <section id="pulse-ai" className="scroll-mt-24 px-5 py-20">
//         <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
//           <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-2 shadow-2xl shadow-emerald-950/10">
//             <img
//               src="/landing/pulse-ai.png"
//               alt="pulse AI assistant screenshot"
//               className="h-[420px] w-full rounded-[1.5rem] object-cover object-top"
//             />
//           </div>

//           <div>
//             <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
//               pulse AI
//             </p>

//             <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
//               AI that understands your context, not just your questions.
//             </h2>

//             <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
//               pulse AI works with your email, calendar, meetings, and tasks. It
//               understands what is going on and helps you move forward.
//             </p>

//             <div className="mt-6 grid gap-3">
//               {[
//                 "Summarize emails and threads",
//                 "Draft professional replies",
//                 "Create meetings with context",
//                 "Extract tasks and deadlines",
//                 "Prepare meeting notes and follow-ups",
//                 "Always require your approval for real actions",
//               ].map((item) => (
//                 <div key={item} className="flex items-center gap-3 text-sm">
//                   <CheckCircle2 className="h-4 w-4 text-emerald-700" />
//                   <span className="text-slate-700">{item}</span>
//                 </div>
//               ))}
//             </div>

//             <div className="mt-8 flex flex-wrap gap-3">
//               <button
//                 type="button"
//                 onClick={goToSignup}
//                 className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
//               >
//                 Get started
//                 <ArrowRight className="h-4 w-4" />
//               </button>

//               <button
//                 type="button"
//                 onClick={() => scrollToSection("control")}
//                 className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
//               >
//                 See approval flow
//               </button>
//             </div>
//           </div>
//         </div>
//       </section>

//       <section
//         id="different"
//         className="scroll-mt-24 border-y border-slate-200 bg-white px-5 py-14"
//       >
//         <div className="mx-auto max-w-7xl">
//           <div className="mx-auto max-w-2xl text-center">
//             <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
//               Why pulse is different
//             </p>

//             <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
//               It is built for actions, not just answers.
//             </h2>
//           </div>

//           <div className="mt-10 grid gap-5 md:grid-cols-3 lg:grid-cols-6">
//             {differentItems.map((item) => (
//               <div
//                 key={item.title}
//                 className="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-950/5"
//               >
//                 <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
//                   <item.icon className="h-5 w-5" />
//                 </div>

//                 <h3 className="mt-4 text-xs font-semibold text-slate-950">
//                   {item.title}
//                 </h3>

//                 <p className="mt-2 text-xs leading-5 text-slate-600">
//                   {item.text}
//                 </p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       <section id="use-cases" className="scroll-mt-24 px-5 py-20">
//         <div className="mx-auto max-w-7xl">
//           <div className="mx-auto max-w-2xl text-center">
//             <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
//               Built for students, professionals & teams
//             </p>

//             <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
//               One assistant for different kinds of work.
//             </h2>
//           </div>

//           <div className="mt-10 grid gap-6 md:grid-cols-3">
//             {useCases.map((item) => (
//               <div
//                 key={item.title}
//                 className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-950/5"
//               >
//                 <div className="flex h-40 items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
//                   <item.icon className="h-16 w-16 text-emerald-700" />
//                 </div>

//                 <div className="p-6">
//                   <h3 className="text-base font-semibold text-emerald-700">
//                     {item.title}
//                   </h3>

//                   <ul className="mt-4 space-y-2">
//                     {item.points.map((point) => (
//                       <li
//                         key={point}
//                         className="flex items-center gap-2 text-sm text-slate-600"
//                       >
//                         <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
//                         {point}
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       <section id="control" className="scroll-mt-24 px-5 pb-20">
//         <div className="mx-auto max-w-7xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5 md:p-8">
//           <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
//             <div className="flex items-start gap-4">
//               <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
//                 <ShieldCheck className="h-7 w-7" />
//               </div>

//               <div>
//                 <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
//                   You are always in control.
//                 </h2>

//                 <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600">
//                   pulse AI suggests and prepares. You review, approve, and
//                   decide what happens next.
//                 </p>
//               </div>
//             </div>

//             <div className="grid gap-3 md:grid-cols-4">
//               <StepCard title="AI suggests" text="Analyzes context" />
//               <StepCard title="You review" text="Check and edit" />
//               <StepCard title="You approve" text="Confirm action" />
//               <StepCard title="Action taken" text="With your approval" />
//             </div>
//           </div>

//           <div className="mt-8 flex flex-wrap justify-center gap-3 border-t border-slate-200 pt-6">
//             <button
//               type="button"
//               onClick={goToSignup}
//               className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
//             >
//               Get started
//               <ArrowRight className="h-4 w-4" />
//             </button>

//             <button
//               type="button"
//               onClick={goToSignup}
//               className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
//             >
//               Sign up
//             </button>
//           </div>
//         </div>
//       </section>

//       <footer className="border-t border-slate-200 bg-white">
//         <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
//           <p>© 2026 pulse. AI workflow layer for Gmail and Calendar.</p>

//           <div className="flex flex-wrap items-center gap-4">
//             <button
//               type="button"
//               onClick={() => scrollToSection("why")}
//               className="hover:text-emerald-700"
//             >
//               Why pulse
//             </button>
//             <button
//               type="button"
//               onClick={() => scrollToSection("pulse-ai")}
//               className="hover:text-emerald-700"
//             >
//               pulse AI
//             </button>
//             <button
//               type="button"
//               onClick={() => scrollToSection("different")}
//               className="hover:text-emerald-700"
//             >
//               Different
//             </button>
//             <button
//               type="button"
//               onClick={() => scrollToSection("top")}
//               className="hover:text-emerald-700"
//             >
//               Back to top
//             </button>
//           </div>
//         </div>
//       </footer>
//     </main>
//   );
// }

// function MiniTrust({ text }: { text: string }) {
//   return (
//     <div className="flex items-center gap-2">
//       <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
//       <span>{text}</span>
//     </div>
//   );
// }

// function StepCard({ title, text }: { title: string; text: string }) {
//   return (
//     <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
//       <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
//         <CheckCircle2 className="h-4 w-4" />
//       </div>

//       <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
//       <p className="mt-1 text-xs text-slate-500">{text}</p>
//     </div>
//   );
// }




























"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Mail,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Workflow,
  Zap,
} from "lucide-react";

const navItems = [
  { label: "Why pulse", id: "why" },
  { label: "pulse AI", id: "pulse-ai" },
  { label: "Screenshots", id: "screenshots" },
  { label: "Different", id: "different" },
  { label: "Use cases", id: "use-cases" },
  { label: "Control", id: "control" },
];

const productCards = [
  {
    title: "pulse AI",
    image: "/landing/pulse-ai.png",
    text: "Ask questions, summarize work, prepare replies, and get next actions from real Gmail and Calendar context.",
  },
  {
    title: "Inbox",
    image: "/landing/inbox.png",
    text: "Read Gmail messages, understand important context, and move from email to action faster.",
  },
  {
    title: "Calendar",
    image: "/landing/calendar.png",
    text: "View your weekly calendar, meetings, and planned actions in one clean workspace.",
  },
  {
    title: "Meetings",
    image: "/landing/meetings.png",
    text: "Prepare agendas, notes, source email context, meeting readiness, and follow-ups.",
  },
  {
    title: "Tasks",
    image: "/landing/tasks.png",
    text: "Track forms, interviews, assessments, follow-ups, and deadlines extracted from Gmail.",
  },
];

const whyItems = [
  {
    icon: Mail,
    title: "Understand faster",
    text: "Summarize emails and detect what needs attention.",
  },
  {
    icon: CalendarDays,
    title: "Plan smarter",
    text: "Create meetings and manage your day easily.",
  },
  {
    icon: Workflow,
    title: "Stay on top",
    text: "Turn important emails into tasks and follow-ups.",
  },
  {
    icon: ShieldCheck,
    title: "Act safely",
    text: "AI drafts and suggests. You approve every real action.",
  },
];

const differentItems = [
  {
    icon: Mail,
    title: "Not a Gmail clone",
    text: "Works on top of Gmail with AI intelligence.",
  },
  {
    icon: CalendarDays,
    title: "Not a Calendar clone",
    text: "Adds workflow and meeting intelligence.",
  },
  {
    icon: BrainCircuit,
    title: "Not just a chatbot",
    text: "Takes context and creates useful next steps.",
  },
  {
    icon: Zap,
    title: "Action-oriented",
    text: "Moves from insight to real approved action.",
  },
  {
    icon: ShieldCheck,
    title: "Approval first",
    text: "You review everything before pulse acts.",
  },
  {
    icon: UsersRound,
    title: "For everyone",
    text: "Useful for students, professionals, and teams.",
  },
];

const useCases = [
  {
    icon: GraduationCap,
    title: "For Students",
    points: [
      "Manage assignments",
      "Track deadlines",
      "Prepare for interviews",
      "Handle placement updates",
    ],
  },
  {
    icon: Clock3,
    title: "For Professionals",
    points: [
      "Handle email and meetings",
      "Stay focused",
      "Draft replies",
      "Follow up on time",
    ],
  },
  {
    icon: UsersRound,
    title: "For Teams",
    points: [
      "Shared visibility",
      "Better collaboration",
      "Aligned tasks",
      "Faster communication",
    ],
  },
];

export default function LandingPage() {
  const router = useRouter();

  function scrollToSection(id: string) {
    const element = document.getElementById(id);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  function goToSignup() {
    router.push("/sign-up");
  }

  return (
    <main
      id="top"
      className="min-h-screen overflow-hidden bg-[#f8fbfa] text-slate-950"
    >
      <style>{`
        html {
          scroll-behavior: smooth;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(22px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes floatSoft {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes glowPulse {
          0%, 100% {
            opacity: 0.45;
            transform: scale(1);
          }
          50% {
            opacity: 0.85;
            transform: scale(1.08);
          }
        }

        @keyframes shineMove {
          from {
            transform: translateX(-130%);
          }
          to {
            transform: translateX(230%);
          }
        }

        .fade-up {
          animation: fadeUp 0.75s ease both;
        }

        .float-soft {
          animation: floatSoft 5s ease-in-out infinite;
        }

        .glow-pulse {
          animation: glowPulse 5s ease-in-out infinite;
        }

        .shine-card {
          position: relative;
          overflow: hidden;
        }

        .shine-card::after {
          content: "";
          position: absolute;
          inset: 0;
          width: 36%;
          pointer-events: none;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.65),
            transparent
          );
          animation: shineMove 5.5s ease-in-out infinite;
        }
      `}</style>

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <button
            type="button"
            onClick={() => scrollToSection("top")}
            className="flex items-center gap-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
              <Zap className="h-4 w-4" />
            </div>
            <span className="text-xl font-semibold tracking-tight">pulse</span>
          </button>

          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className="transition hover:text-emerald-700"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToSignup}
              className="hidden rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50 sm:inline-flex"
            >
              Sign up
            </button>

            <button
              type="button"
              onClick={goToSignup}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-800"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-5 pb-16 pt-16 md:pt-20">
        <div className="absolute left-0 top-12 h-72 w-72 rounded-full bg-emerald-200 blur-3xl glow-pulse" />
        <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-teal-100 blur-3xl glow-pulse" />

        <div className="relative grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="fade-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" />
              AI workflow layer for Gmail & Calendar
            </div>

            <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 md:text-6xl">
              One place for email, meetings, tasks and{" "}
              <span className="text-emerald-700">AI actions.</span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 md:text-base">
              pulse connects with your real Gmail and Google Calendar to help
              you understand, plan, and act — with your approval.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={goToSignup}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/10 transition hover:-translate-y-0.5 hover:bg-emerald-800"
              >
                Get started
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={goToSignup}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-semibold text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50"
              >
                Sign up
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => scrollToSection("screenshots")}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                View real screenshots
                <ArrowRight className="h-4 w-4 rotate-90" />
              </button>
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-2 gap-3 text-xs text-slate-600 sm:grid-cols-4">
              <MiniTrust text="Gmail & Calendar" />
              <MiniTrust text="AI Copilot" />
              <MiniTrust text="User Approved" />
              <MiniTrust text="For work & study" />
            </div>
          </div>

          <div className="relative float-soft">
            <div className="shine-card rounded-[2rem] border border-slate-200 bg-white p-2 shadow-2xl shadow-emerald-950/10">
              <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-100">
                <img
                  src="/landing/pulse-ai.png"
                  alt="pulse AI project screenshot"
                  className="h-[420px] w-full object-cover object-top"
                />
              </div>
            </div>

            <div className="pointer-events-none absolute -bottom-8 left-1/2 h-24 w-[80%] -translate-x-1/2 rounded-full bg-emerald-200/80 blur-3xl" />
          </div>
        </div>
      </section>

      <section id="why" className="scroll-mt-24 px-5 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Why pulse?
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              Because your time deserves better.
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Most of your day goes into reading, switching tabs, and
              remembering. pulse brings everything together and helps you focus
              on what matters.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {whyItems.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-950/5"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <item.icon className="h-5 w-5" />
                </div>

                <h3 className="mt-4 text-sm font-semibold text-slate-950">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="screenshots"
        className="scroll-mt-24 border-y border-slate-200 bg-white px-5 py-16"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Real project screenshots
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                See the actual pulse workspace.
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                These images come directly from your project folder:
                public/landing.
              </p>
            </div>

            <button
              type="button"
              onClick={goToSignup}
              className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-800"
            >
              Try pulse
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-5">
            {productCards.map((card) => (
              <div
                key={card.title}
                className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-950/5"
              >
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                  <img
                    src={card.image}
                    alt={`${card.title} screenshot`}
                    className="h-44 w-full object-cover object-top"
                  />
                </div>

                <div className="px-1 py-4">
                  <h3 className="text-sm font-semibold text-slate-950">
                    {card.title}
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    {card.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-100 p-2 shadow-xl shadow-slate-950/5">
            <img
              src="/landing/inbox.png"
              alt="pulse inbox full screenshot"
              className="h-[520px] w-full rounded-[1.5rem] object-cover object-top"
            />
          </div>
        </div>
      </section>

      <section id="pulse-ai" className="scroll-mt-24 px-5 py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-2 shadow-2xl shadow-emerald-950/10">
            <img
              src="/landing/pulse-ai.png"
              alt="pulse AI assistant screenshot"
              className="h-[420px] w-full rounded-[1.5rem] object-cover object-top"
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              pulse AI
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              AI that understands your context, not just your questions.
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
              pulse AI works with your email, calendar, meetings, and tasks. It
              understands what is going on and helps you move forward.
            </p>

            <div className="mt-6 grid gap-3">
              {[
                "Summarize emails and threads",
                "Draft professional replies",
                "Create meetings with context",
                "Extract tasks and deadlines",
                "Prepare meeting notes and follow-ups",
                "Always require your approval for real actions",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  <span className="text-slate-700">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={goToSignup}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
              >
                Get started
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => scrollToSection("control")}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                See approval flow
              </button>
            </div>
          </div>
        </div>
      </section>

      <section
        id="different"
        className="scroll-mt-24 border-y border-slate-200 bg-white px-5 py-14"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Why pulse is different
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              It is built for actions, not just answers.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3 lg:grid-cols-6">
            {differentItems.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-950/5"
              >
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <item.icon className="h-5 w-5" />
                </div>

                <h3 className="mt-4 text-xs font-semibold text-slate-950">
                  {item.title}
                </h3>

                <p className="mt-2 text-xs leading-5 text-slate-600">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="use-cases" className="scroll-mt-24 px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Built for students, professionals & teams
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              One assistant for different kinds of work.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {useCases.map((item) => (
              <div
                key={item.title}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-950/5"
              >
                <div className="flex h-40 items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
                  <item.icon className="h-16 w-16 text-emerald-700" />
                </div>

                <div className="p-6">
                  <h3 className="text-base font-semibold text-emerald-700">
                    {item.title}
                  </h3>

                  <ul className="mt-4 space-y-2">
                    {item.points.map((point) => (
                      <li
                        key={point}
                        className="flex items-center gap-2 text-sm text-slate-600"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="control" className="scroll-mt-24 px-5 pb-20">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5 md:p-8">
          <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <ShieldCheck className="h-7 w-7" />
              </div>

              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                  You are always in control.
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600">
                  pulse AI suggests and prepares. You review, approve, and
                  decide what happens next.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <StepCard title="AI suggests" text="Analyzes context" />
              <StepCard title="You review" text="Check and edit" />
              <StepCard title="You approve" text="Confirm action" />
              <StepCard title="Action taken" text="With your approval" />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3 border-t border-slate-200 pt-6">
            <button
              type="button"
              onClick={goToSignup}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={goToSignup}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
            >
              Sign up
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© 2026 pulse. AI workflow layer for Gmail and Calendar.</p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => scrollToSection("why")}
              className="hover:text-emerald-700"
            >
              Why pulse
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("pulse-ai")}
              className="hover:text-emerald-700"
            >
              pulse AI
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("different")}
              className="hover:text-emerald-700"
            >
              Different
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("top")}
              className="hover:text-emerald-700"
            >
              Back to top
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}

function MiniTrust({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
      <span>{text}</span>
    </div>
  );
}

function StepCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
        <CheckCircle2 className="h-4 w-4" />
      </div>

      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <p className="mt-1 text-xs text-slate-500">{text}</p>
    </div>
  );
}