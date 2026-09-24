"use client";

import { useState } from "react";
import Link from "next/link";

type Status = "idle" | "sending" | "sent" | "error";
const MAX_RESUME_MB = 5;

export default function CareersPage() {
	const [status, setStatus] = useState<Status>("idle");
	const [error, setError] = useState("");
	const [fileName, setFileName] = useState("");

	const submit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (status === "sending") return;
		setError("");
		const form = e.currentTarget;
		const data = new FormData(form);
		const resume = data.get("resume") as File | null;
		if (!resume || !resume.size) { setError("Please attach your resume."); return; }
		if (resume.size > MAX_RESUME_MB * 1024 * 1024) { setError(`Resume must be under ${MAX_RESUME_MB} MB.`); return; }
		setStatus("sending");
		try {
			const res = await fetch("/api/careers/apply/", { method: "POST", body: data });
			const json = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(json.error || "Something went wrong.");
			setStatus("sent");
			form.reset();
		} catch (err: unknown) {
			setStatus("error");
			setError(err instanceof Error ? err.message : "Something went wrong. Please try again or email hello@manhattanmintnyc.com.");
		}
	};

	return (
		<>
			<style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');
			:root { --mint: #1D9E75; --mint-dark: #157a5a; --mint-light: #E8F5F0; --dark: #0F0F0F; --gray: #777; --soft: #F8F8F6; }
			.cw-page { min-height: 100vh; background: var(--soft); color: var(--dark); font-family: 'DM Sans', sans-serif; }
			.cw-wrap { max-width: 1040px; margin: 0 auto; padding: 4rem 1rem 6rem; }
			.cw-back { color: var(--mint); text-decoration: none; font-size: .9rem; }
			.cw-eye { color: var(--mint); letter-spacing: .12em; text-transform: uppercase; font-size: .72rem; margin: 2rem 0 .6rem; }
			.cw-h1 { font-family: 'DM Serif Display', serif; font-weight: 400; font-size: clamp(2.1rem, 4.5vw, 3.2rem); line-height: 1.08; margin: 0 0 1rem; }
			.cw-h1 em { font-style: italic; color: var(--mint-dark); }
			.cw-lead { font-size: 1.08rem; font-weight: 300; color: #333; line-height: 1.6; margin: 0 0 2rem; max-width: 60ch; }
			.cw-grid { display: grid; gap: 2rem; grid-template-columns: 1fr; align-items: start; }
			@media (min-width: 880px) { .cw-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 460px); } }
			.cw-points { display: grid; gap: 1rem; }
			.cw-point { background: #fff; border: 1px solid rgba(0,0,0,.08); border-radius: 14px; padding: 1.1rem 1.25rem; }
			.cw-point h2 { font-size: 1rem; margin: 0 0 .3rem; }
			.cw-point p { margin: 0; color: #444; font-size: .92rem; line-height: 1.6; }
			.cw-form { background: #fff; border: 1px solid rgba(0,0,0,.08); border-radius: 18px; padding: 1.6rem; box-shadow: 0 24px 60px rgba(8,80,65,.08); }
			.cw-form h2 { font-family: 'DM Serif Display', serif; font-weight: 400; font-size: 1.5rem; margin: 0 0 1rem; }
			.cw-field { display: grid; gap: .3rem; margin-bottom: .9rem; }
			.cw-field label { font-size: .75rem; letter-spacing: .06em; text-transform: uppercase; color: #666; }
			.cw-field input, .cw-field select, .cw-field textarea { border: 1px solid rgba(0,0,0,.15); border-radius: 10px; padding: .75rem .85rem; font: inherit; font-size: .95rem; background: #fff; width: 100%; }
			.cw-field input:focus, .cw-field select:focus, .cw-field textarea:focus { outline: none; border-color: var(--mint); box-shadow: 0 0 0 3px rgba(29,158,117,.15); }
			.cw-file { display: flex; align-items: center; gap: .8rem; border: 1px dashed rgba(29,158,117,.5); border-radius: 10px; padding: .8rem .9rem; background: var(--mint-light); cursor: pointer; }
			.cw-file input { position: absolute; opacity: 0; width: 1px; height: 1px; }
			.cw-file-btn { background: var(--dark); color: #fff; border-radius: 8px; padding: .45rem .8rem; font-size: .85rem; font-weight: 500; white-space: nowrap; }
			.cw-file-name { font-size: .88rem; color: #333; }
			.cw-submit { width: 100%; border: none; border-radius: 12px; background: var(--mint); color: #fff; padding: .95rem 1rem; font: inherit; font-size: 1rem; font-weight: 600; cursor: pointer; margin-top: .4rem; }
			.cw-submit:hover { background: var(--mint-dark); }
			.cw-submit:disabled { opacity: .7; cursor: wait; }
			.cw-fine { color: var(--gray); font-size: .78rem; line-height: 1.55; margin: .8rem 0 0; }
			.cw-error { color: #b42318; font-size: .88rem; margin: .6rem 0 0; }
			.cw-sent { text-align: center; padding: 2rem 1rem; }
			.cw-sent .big { font-size: 2.2rem; color: var(--mint); margin-bottom: .6rem; }
			.cw-hp { position: absolute; left: -9999px; }
			`}</style>

			<div className="cw-page">
				<div className="cw-wrap">
					<Link href="/" className="cw-back">← Manhattan Mint</Link>
					<p className="cw-eye">Come work with us</p>
					<h1 className="cw-h1">
						Good cleaners are hard to find.<br />
						<em>We pay like we know it.</em>
					</h1>
					<p className="cw-lead">
						Manhattan Mint is a small, owner-run apartment cleaning company working only in Manhattan. We send our
						cleaners to the same clients again and again, pay every Friday, and back you up when a building or a
						client makes the day harder than it should be.
					</p>

					<div className="cw-grid">
						<div className="cw-points">
							<div className="cw-point">
								<h2>Paid every Friday</h2>
								<p>Every job has a set rate you know before you go. Payouts land by Stripe on Fridays, no chasing.</p>
							</div>
							<div className="cw-point">
								<h2>Your days, your area</h2>
								<p>Tell us which days you work. Every job is in Manhattan, so you are never sent to the outer boroughs or New Jersey.</p>
							</div>
							<div className="cw-point">
								<h2>The same clients, again and again</h2>
								<p>Recurring clients keep their cleaner. The second and third visits to an apartment are faster than the first, and the tips are better.</p>
							</div>
							<div className="cw-point">
								<h2>Real support</h2>
								<p>Job details, access notes and building rules come to your phone before every clean. If a doorman or a client holds you up, you text the owner and it gets handled.</p>
							</div>
							<div className="cw-point">
								<h2>What we ask</h2>
								<p>At least a year of professional cleaning experience, a background check (we cover it), your own reliable phone, and pride in the work. Photos of every room when you finish.</p>
							</div>
						</div>

						<form className="cw-form" onSubmit={submit} encType="multipart/form-data">
							{status === "sent" ? (
								<div className="cw-sent">
									<div className="big">✓</div>
									<h2>Got it. Thank you.</h2>
									<p style={{ color: "#444", lineHeight: 1.6 }}>Your application went straight to the owner. If it looks like a fit, you&apos;ll hear from us within a few days, usually by text.</p>
								</div>
							) : (
								<>
									<h2>Apply in two minutes</h2>
									<div className="cw-field">
										<label htmlFor="name">Full name</label>
										<input id="name" name="name" type="text" required autoComplete="name" />
									</div>
									<div className="cw-field">
										<label htmlFor="email">Email</label>
										<input id="email" name="email" type="email" required autoComplete="email" />
									</div>
									<div className="cw-field">
										<label htmlFor="phone">Phone</label>
										<input id="phone" name="phone" type="tel" required autoComplete="tel" placeholder="(212) 555-0100" />
									</div>
									<div className="cw-field">
										<label htmlFor="years">Years of cleaning experience</label>
										<select id="years" name="years" required defaultValue="">
											<option value="" disabled>Select</option>
											<option>Less than 1 year</option>
											<option>1 to 2 years</option>
											<option>3 to 5 years</option>
											<option>6 to 10 years</option>
											<option>More than 10 years</option>
										</select>
									</div>
									<div className="cw-field">
										<label htmlFor="resume">Resume (PDF or Word)</label>
										<label className="cw-file" htmlFor="resume">
											<span className="cw-file-btn">Choose file</span>
											<span className="cw-file-name">{fileName || "No file chosen"}</span>
											<input id="resume" name="resume" type="file" required accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => setFileName(e.target.files?.[0]?.name || "")} />
										</label>
									</div>
									<div className="cw-field">
										<label htmlFor="notes">Anything else (optional)</label>
										<textarea id="notes" name="notes" rows={3} placeholder="Days you can work, neighborhoods you know, where you've cleaned before" />
									</div>
									<input className="cw-hp" type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" />
									<button className="cw-submit" type="submit" disabled={status === "sending"}>
										{status === "sending" ? "Sending..." : "Send my application"}
									</button>
									{error ? <p className="cw-error">{error}</p> : null}
									<p className="cw-fine">
										Your application goes directly to Manhattan Mint NYC. We only use it to consider you for cleaning work and never share it.
									</p>
								</>
							)}
						</form>
					</div>
				</div>
			</div>
		</>
	);
}
