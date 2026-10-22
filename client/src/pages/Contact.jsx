/**
 * Contact.jsx
 * Contact page — official UMaT department info, office hours, email, general inquiry form,
 * and interactive "Book Me" appointment scheduling for Dr. Alhassan Osman.
 */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Building2,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  X,
  CalendarCheck,
  MessageSquare,
  Phone,
  User,
  GraduationCap,
  Calendar,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import API from '../lib/api';

export default function Contact() {
  const { settings } = useSettings();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active tab: 'message' or 'book'
  const initialTab = searchParams.get('tab') === 'book' ? 'book' : 'message';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (searchParams.get('tab') === 'book') {
      setActiveTab('book');
    }
  }, [searchParams]);

  // General Message State
  const [messageForm, setMessageForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  // Booking State
  const [bookingForm, setBookingForm] = useState({
    name: '',
    email: '',
    phone: '',
    studentId: '',
    purpose: 'Academic Advising',
    preferredDate: '',
    preferredTime: 'Mon: 10:00 AM – 11:00 AM',
    message: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [inlineNotice, setInlineNotice] = useState(null);

  const email = settings.email || 'aosman@umat.edu.gh';
  const department = settings.department || 'Department of Electrical and Electronic Engineering';
  const officeLocation = settings.officeLocation || 'Department of Electrical and Electronic Engineering, UMaT, Tarkwa, Ghana';
  const officeHours = settings.officeHours || 'Mon & Wed: 10:00 AM – 12:00 PM | Fri: 2:00 PM – 4:00 PM (or by appointment)';

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'book' ? { tab: 'book' } : {});
    setInlineNotice(null);
  };

  // Submit General Message
  const handleMessageSubmit = async (e) => {
    e.preventDefault();
    if (!messageForm.name.trim() || !messageForm.email.trim() || !messageForm.message.trim()) {
      toast.error('Please complete all required fields.');
      setInlineNotice({ type: 'error', message: 'Please complete all required fields.' });
      return;
    }

    setSubmitting(true);
    setInlineNotice(null);

    try {
      const res = await API.post('/contact', {
        type: 'inquiry',
        name: messageForm.name,
        email: messageForm.email,
        subject: messageForm.subject,
        message: messageForm.message,
      });

      const successMsg = res.data.message || 'Thank you! Your message has been sent to Dr. Alhassan.';
      toast.success(successMsg, 'Message Sent');
      setInlineNotice({ type: 'success', message: successMsg });
      setMessageForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to send message. Please try again or email directly.';
      toast.error(errorMsg, 'Message Failed');
      setInlineNotice({ type: 'error', message: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Booking Request
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookingForm.name.trim() || !bookingForm.email.trim() || !bookingForm.preferredDate) {
      toast.error('Please provide your name, email, and preferred appointment date.');
      setInlineNotice({ type: 'error', message: 'Please provide your name, email, and preferred appointment date.' });
      return;
    }

    setSubmitting(true);
    setInlineNotice(null);

    try {
      const res = await API.post('/contact', {
        type: 'booking',
        name: bookingForm.name,
        email: bookingForm.email,
        phone: bookingForm.phone,
        studentId: bookingForm.studentId,
        purpose: bookingForm.purpose,
        preferredDate: bookingForm.preferredDate,
        preferredTime: bookingForm.preferredTime,
        message: bookingForm.message,
      });

      const successMsg = res.data.message || 'Your appointment request has been scheduled! Dr. Alhassan will review it shortly.';
      toast.success(successMsg, 'Appointment Booked');
      setInlineNotice({ type: 'success', message: successMsg });
      setBookingForm({
        name: '',
        email: '',
        phone: '',
        studentId: '',
        purpose: 'Academic Advising',
        preferredDate: '',
        preferredTime: 'Mon: 10:00 AM – 11:00 AM',
        message: '',
      });
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to submit booking request. Please try again.';
      toast.error(errorMsg, 'Booking Failed');
      setInlineNotice({ type: 'error', message: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      {/* ── Background Gradients ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-[140px]" />
      </div>

      {/* ── Page Hero ── */}
      <section className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-6"
          >
            <Mail className="w-4 h-4" />
            <span>Academic Correspondence &amp; Office Bookings</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white mb-4"
          >
            Contact &amp; Book Dr. Alhassan
          </motion.h1>

          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Schedule an in-person or virtual consultation during official office hours, or send a direct inquiry regarding courses, smart grids, and research.
          </p>
        </div>
      </section>

      {/* ── Main Content Grid ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Cards: Department, Office Hours, Email */}
          <div className="space-y-4">
            {/* Dr. Alhassan in Office Photo Card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-md group">
              <div className="relative h-48 w-full overflow-hidden">
                <img
                  src="/images/dr-alhassan-office.jpg"
                  alt="Dr. Alhassan Osman at UMaT Faculty Office"
                  className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
                <span className="absolute bottom-3 left-3 rounded-md bg-emerald-500 px-2.5 py-0.5 text-[11px] font-bold text-slate-950 shadow">
                  Faculty Office · UMaT
                </span>
              </div>
              <div className="p-4">
                <p className="text-xs font-bold text-slate-900 dark:text-white">In-Person &amp; Office Consultation</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Students and researchers are welcome to meet Dr. Alhassan Osman at the Department during designated office hours.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 shadow-sm backdrop-blur-md">
              <div className="p-3 w-fit rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-3">
                <Mail size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">Email Address</h3>
              <a
                href={`mailto:${email}`}
                className="text-emerald-600 dark:text-emerald-400 hover:underline text-sm font-semibold break-all"
              >
                {email}
              </a>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Official institutional mailbox</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 shadow-sm backdrop-blur-md">
              <div className="p-3 w-fit rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 mb-3">
                <Building2 size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">Academic Department</h3>
              <p className="text-slate-800 dark:text-slate-200 text-sm font-medium mb-1">{department}</p>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{officeLocation}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 shadow-sm backdrop-blur-md">
              <div className="p-3 w-fit rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 mb-3">
                <Clock size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">Office Hours</h3>
              <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed">{officeHours}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                Students and researchers can reserve a slot using the &ldquo;Book Me&rdquo; tab.
              </p>
            </div>

            {/* Quick Book Callout */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-950/20 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm font-bold mb-1">
                <Sparkles size={16} />
                <span>Need Academic Advising?</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                Select a dedicated 30–60 minute session for project reviews, Control Systems coursework, or career guidance.
              </p>
              <button
                type="button"
                onClick={() => handleTabChange('book')}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 dark:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white dark:text-slate-950 hover:bg-emerald-700 dark:hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <CalendarCheck size={14} />
                <span>Book an Office Hour Now</span>
              </button>
            </div>
          </div>

          {/* Right Column: Tabbed Forms */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 sm:p-8 backdrop-blur-md shadow-xl">
            {/* Tab Switcher */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
              <button
                type="button"
                onClick={() => handleTabChange('message')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'message'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <MessageSquare size={16} />
                <span>Send a Message</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('book')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'book'
                    ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-300 dark:border-slate-700/80'
                }`}
              >
                <CalendarCheck size={16} />
                <span>Book Me (Office Hours)</span>
              </button>
            </div>

            {/* Notification Toast */}
            {inlineNotice && (
              <div
                className={`mb-6 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
                  inlineNotice.type === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  {inlineNotice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{inlineNotice.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setInlineNotice(null)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* TAB 1: General Message */}
            {activeTab === 'message' && (
              <motion.div
                key="message-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Send a Direct Message</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Your inquiry will be logged directly to Dr. Alhassan Osman&apos;s administrative portal.
                  </p>
                </div>

                <form onSubmit={handleMessageSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Your Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={messageForm.name}
                        onChange={(e) => setMessageForm({ ...messageForm, name: e.target.value })}
                        required
                        placeholder="e.g. Kwame Mensah"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Your Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={messageForm.email}
                        onChange={(e) => setMessageForm({ ...messageForm, email: e.target.value })}
                        required
                        placeholder="e.g. student@st.umat.edu.gh"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      Subject / Topic
                    </label>
                    <input
                      type="text"
                      value={messageForm.subject}
                      onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                      placeholder="e.g. Past Questions Inquiry or Research Project Discussion"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      Message Details <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={5}
                      value={messageForm.message}
                      onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                      required
                      placeholder="Type your message here..."
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition resize-y"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 dark:bg-emerald-500 px-6 py-3 text-sm font-semibold text-white dark:text-slate-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-700 dark:hover:bg-emerald-400 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                      <span>{submitting ? 'Sending Message…' : 'Send Message'}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* TAB 2: Book Me (Office Hours) */}
            {activeTab === 'book' && (
              <motion.div
                key="book-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <CalendarCheck className="text-emerald-600 dark:text-emerald-400" size={20} />
                      Book an Office Hour / Appointment
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Reserve a consultation with Dr. Alhassan Osman at UMaT or online.
                    </p>
                  </div>
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 self-start sm:self-auto">
                    Active Office Hours
                  </div>
                </div>

                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={bookingForm.name}
                        onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                        required
                        placeholder="e.g. Ama Darko"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={bookingForm.email}
                        onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                        required
                        placeholder="e.g. adarko@st.umat.edu.gh"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Phone / WhatsApp (Optional)
                      </label>
                      <input
                        type="tel"
                        value={bookingForm.phone}
                        onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                        placeholder="e.g. +233 50 123 4567"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Student ID / Index / Org (Optional)
                      </label>
                      <input
                        type="text"
                        value={bookingForm.studentId}
                        onChange={(e) => setBookingForm({ ...bookingForm, studentId: e.target.value })}
                        placeholder="e.g. 4100813923 or FCM4100813923"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Purpose of Booking
                      </label>
                      <select
                        value={bookingForm.purpose}
                        onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                      >
                        <option value="Academic Advising">Academic Advising</option>
                        <option value="Control Systems Coursework">Control Systems Coursework</option>
                        <option value="Final Year Project Supervision">Final Year Project Supervision</option>
                        <option value="Past Questions Discussion">Past Questions Discussion</option>
                        <option value="Research & Smart Grids">Research &amp; Smart Grids</option>
                        <option value="General Consultation">General Consultation</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Preferred Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={bookingForm.preferredDate}
                        onChange={(e) => setBookingForm({ ...bookingForm, preferredDate: e.target.value })}
                        required
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Preferred Time Slot
                      </label>
                      <select
                        value={bookingForm.preferredTime}
                        onChange={(e) => setBookingForm({ ...bookingForm, preferredTime: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                      >
                        <option value="Mon: 10:00 AM – 11:00 AM">Mon: 10:00 AM – 11:00 AM</option>
                        <option value="Mon: 11:00 AM – 12:00 PM">Mon: 11:00 AM – 12:00 PM</option>
                        <option value="Wed: 10:00 AM – 11:00 AM">Wed: 10:00 AM – 11:00 AM</option>
                        <option value="Wed: 11:00 AM – 12:00 PM">Wed: 11:00 AM – 12:00 PM</option>
                        <option value="Fri: 2:00 PM – 3:00 PM">Fri: 2:00 PM – 3:00 PM</option>
                        <option value="Fri: 3:00 PM – 4:00 PM">Fri: 3:00 PM – 4:00 PM</option>
                        <option value="By Special Appointment">By Special Appointment</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      Notes / What would you like to discuss?
                    </label>
                    <textarea
                      rows={3}
                      value={bookingForm.message}
                      onChange={(e) => setBookingForm({ ...bookingForm, message: e.target.value })}
                      placeholder="Briefly describe what you'd like to consult on or any specific questions..."
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition resize-y"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 dark:bg-emerald-500 px-6 py-3 text-sm font-bold text-white dark:text-slate-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-700 dark:hover:bg-emerald-400 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {submitting ? <Loader2 size={15} className="animate-spin" /> : <CalendarCheck size={16} />}
                      <span>{submitting ? 'Submitting Booking…' : 'Confirm & Request Booking'}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
