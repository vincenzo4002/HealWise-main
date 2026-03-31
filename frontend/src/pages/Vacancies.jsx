import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";

const Vacancies = () => {
  const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
  const navigate = useNavigate();
  const { token } = useContext(AppContext);

  const [loading, setLoading] = useState(true);
  const [vacancies, setVacancies] = useState([]);
  const [applyOpen, setApplyOpen] = useState(false);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [activeVacancy, setActiveVacancy] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    age: "",
    phone: "",
    additionalInfo: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [resumePdf, setResumePdf] = useState(null);
  const profileRef = useRef(null);
  const resumeRef = useRef(null);
  const [fileErrors, setFileErrors] = useState({ profile: "", resume: "" });

  const MAX_IMAGE_BYTES = 1 * 1024 * 1024; // 1MB
  const MAX_RESUME_BYTES = 2 * 1024 * 1024; // 2MB

  const loadVacancies = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/vacancies`);
      const data = await res.json();
      if (data.success) {
        setVacancies(data.data || []);
      } else {
        toast.error(data.message || "Failed to fetch vacancies");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch vacancies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVacancies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Fetch applications of current user to disable already applied vacancies
    const tokenLS = token || localStorage.getItem('token');
    if (tokenLS) {
      fetch(`${API}/api/user/my-applications`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'token': tokenLS 
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data?.success && Array.isArray(data.data)) {
            const ids = new Set(data.data.map(app => app?.vacancy?._id).filter(Boolean));
            setAppliedIds(ids);
          }
        })
        .catch(err => console.error('failed to load user applications', err));
    }
  }, [token]);

  const openApply = (vacancy) => {
    // Check if already applied
    if (appliedIds.has(vacancy._id)) {
      toast.error('You have already applied for this role');
      return;
    }
    if (!token) {
      toast.info("Please log in to apply");
      navigate("/login");
      return;
    }
    setActiveVacancy(vacancy);
    setForm({ name: "", email: "", age: "", phone: "", additionalInfo: "" });
    setProfileImage(null);
    setResumePdf(null);
    setFileErrors({ profile: "", resume: "" });
    if (profileRef.current) profileRef.current.value = "";
    if (resumeRef.current) resumeRef.current.value = "";
    setApplyOpen(true);
  };

  const closeApply = () => {
    setApplyOpen(false);
    setActiveVacancy(null);
    setSubmitting(false);
  };

  const onProfileChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setProfileImage(null);
      setFileErrors((s) => ({ ...s, profile: "" }));
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      if (profileRef.current) profileRef.current.value = "";
      setProfileImage(null);
      setFileErrors((s) => ({
        ...s,
        profile: "Invalid file type. Please upload an image (JPG/PNG).",
      }));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Profile image must be 1 MB or smaller");
      if (profileRef.current) profileRef.current.value = "";
      setProfileImage(null);
      setFileErrors((s) => ({
        ...s,
        profile: "Profile image too large. Upload up to 1 MB.",
      }));
      return;
    }
    setProfileImage(file);
    setFileErrors((s) => ({ ...s, profile: "" }));
  };

  const onResumeChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setResumePdf(null);
      setFileErrors((s) => ({ ...s, resume: "" }));
      return;
    }
    if (file.type !== "application/pdf") {
      toast.error("Please select a PDF resume");
      if (resumeRef.current) resumeRef.current.value = "";
      setResumePdf(null);
      setFileErrors((s) => ({
        ...s,
        resume: "Invalid file type. Please upload a PDF.",
      }));
      return;
    }
    if (file.size > MAX_RESUME_BYTES) {
      toast.error("Resume must be 2 MB or smaller");
      if (resumeRef.current) resumeRef.current.value = "";
      setResumePdf(null);
      setFileErrors((s) => ({
        ...s,
        resume: "Resume too large. Upload up to 2 MB.",
      }));
      return;
    }
    setResumePdf(file);
    setFileErrors((s) => ({ ...s, resume: "" }));
  };

  const removeProfile = () => {
    setProfileImage(null);
    if (profileRef.current) profileRef.current.value = "";
  };

  const removeResume = () => {
    setResumePdf(null);
    if (resumeRef.current) resumeRef.current.value = "";
  };

  const isValid = useMemo(() => {
    const emailOk = /.+@.+\..+/.test(form.email.trim());
    const ageNum = parseInt(form.age, 10);
    const phoneOk = /[0-9]{7,}/.test(form.phone.trim());
    return (
      form.name.trim() &&
      emailOk &&
      !Number.isNaN(ageNum) &&
      ageNum > 0 &&
      phoneOk &&
      profileImage instanceof File &&
      resumePdf instanceof File
    );
  }, [form, profileImage, resumePdf]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!activeVacancy || !token) return;

    if (!isValid) {
      toast.error("Please fill all required fields and attach files");
      return;
    }

    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("email", form.email.trim());
      fd.append("age", form.age);
      fd.append("phone", form.phone.trim());
      fd.append("additionalInfo", form.additionalInfo.trim());
      fd.append("profileImage", profileImage);
      fd.append("resume", resumePdf);

      // Correct endpoint: /api/user/vacancies/:id/apply
      const target = `${API}/api/user/vacancies/${activeVacancy._id}/apply`;
      
      const res = await fetch(target, {
        method: "POST",
        body: fd,
        headers: {
          'token': token
        }
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Submission failed");
      }

      toast.success("Application submitted successfully");
      
      // Optimistically add vacancy to appliedIds set
      setAppliedIds(prev => {
        const copy = new Set(prev);
        copy.add(activeVacancy._id);
        return copy;
      });

      closeApply();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Current Vacancies</h1>
      {loading ? (
        <div className="py-10 text-center text-gray-600">
          Loading vacancies...
        </div>
      ) : vacancies.length === 0 ? (
        <div className="py-10 text-center text-gray-600">
          No current vacancies.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {vacancies.map((v) => (
            <div
              key={v._id}
              className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">{v.specialization}</h2>
                  <p className="text-sm text-gray-600">
                    {v.location} • {v.experience}
                  </p>
                  <p className="text-sm text-gray-600">
                    Openings: {v.vacancies}
                  </p>
                </div>
              </div>
              {v.description && (
                <p className="mt-3 text-gray-700 text-sm whitespace-pre-line line-clamp-3">
                  {v.description}
                </p>
              )}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => openApply(v)}
                  disabled={appliedIds.has(v._id)}
                  className={`px-4 py-2 rounded text-white font-medium transition-all ${
                    appliedIds.has(v._id)
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                  }`}
                >
                  {appliedIds.has(v._id) ? 'Already Applied' : 'Apply Now'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Apply Modal */}
      {applyOpen && activeVacancy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg my-8">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-semibold">
                Apply for {activeVacancy.specialization}
              </h3>
              <button
                onClick={closeApply}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={onSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age *
                  </label>
                  <input
                    type="number"
                    placeholder="Enter your age"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    min={18}
                    max={70}
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="Enter your mobile number"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                </div>

                {/* Profile Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profile Image (JPG/PNG) *
                  </label>
                  <div className="space-y-2">
                    <label className="block px-3 py-2 border-2 border-dashed rounded cursor-pointer bg-gray-50 hover:bg-gray-100 text-center transition-colors">
                      <span className="text-sm font-medium text-gray-700">
                        {profileImage ? 'Change Image' : 'Select Image'}
                      </span>
                      <input
                        ref={profileRef}
                        type="file"
                        accept="image/*"
                        onChange={onProfileChange}
                        className="hidden"
                      />
                    </label>
                    {profileImage && (
                      <div className="flex items-center justify-between gap-2 w-full rounded border bg-green-50 px-2 py-1">
                        <span
                          title={profileImage.name}
                          className="text-sm text-gray-700 flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
                        >
                          ✓ {profileImage.name}
                        </span>
                        <button
                          type="button"
                          onClick={removeProfile}
                          className="shrink-0 text-red-600 text-sm hover:underline font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      Max 1 MB. JPG/PNG only.
                    </div>
                    {fileErrors.profile && (
                      <div className="text-xs text-red-600 font-medium" aria-live="polite">
                        ⚠ {fileErrors.profile}
                      </div>
                    )}
                  </div>
                </div>

                {/* Resume */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resume (PDF) *
                  </label>
                  <div className="space-y-2">
                    <label className="block px-3 py-2 border-2 border-dashed rounded cursor-pointer bg-gray-50 hover:bg-gray-100 text-center transition-colors">
                      <span className="text-sm font-medium text-gray-700">
                        {resumePdf ? 'Change Resume' : 'Select PDF'}
                      </span>
                      <input
                        ref={resumeRef}
                        type="file"
                        accept="application/pdf"
                        onChange={onResumeChange}
                        className="hidden"
                      />
                    </label>
                    {resumePdf && (
                      <div className="flex items-center justify-between gap-2 w-full rounded border bg-green-50 px-2 py-1">
                        <span
                          title={resumePdf.name}
                          className="text-sm text-gray-700 flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
                        >
                          ✓ {resumePdf.name}
                        </span>
                        <button
                          type="button"
                          onClick={removeResume}
                          className="shrink-0 text-red-600 text-sm hover:underline font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      Max 2 MB. PDF only.
                    </div>
                    {fileErrors.resume && (
                      <div className="text-xs text-red-600 font-medium" aria-live="polite">
                        ⚠ {fileErrors.resume}
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Info */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Information
                  </label>
                  <textarea
                    placeholder="Share your cover letter, portfolio links, or any additional information..."
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-32"
                    value={form.additionalInfo}
                    onChange={(e) =>
                      setForm({ ...form, additionalInfo: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeApply}
                  disabled={submitting}
                  className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isValid || submitting}
                  className={`px-4 py-2 rounded text-white font-medium transition-all ${
                    isValid && !submitting
                      ? "bg-green-600 hover:bg-green-700 active:scale-95"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vacancies;