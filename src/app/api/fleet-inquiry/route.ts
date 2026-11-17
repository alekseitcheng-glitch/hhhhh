import { NextRequest, NextResponse } from "next/server";
import { transporter, senderEmail } from "@/lib/email";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      company,
      email,
      phone,
      fleetSize,
      location,
      parkingType,
      accessMethod,
      serviceType,
      vehicles,
      notes,
    } = body;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Name, email, and phone number are required." },
        { status: 400 }
      );
    }

    // Try saving to DB if table is accessible
    try {
      if ((db as any)?.fleetInquiry) {
        await (db as any).fleetInquiry.create({
          data: {
            hostName: name,
            companyName: company || null,
            email,
            phone,
            fleetSize: String(fleetSize || "1"),
            location: location || "San Francisco",
            parkingType: parkingType || null,
            accessMethod: accessMethod || null,
            serviceType: serviceType || "Express Turnover",
            vehicles: vehicles || null,
            notes: notes || "",
          },
        });
      }
    } catch (dbErr: any) {
      console.warn("[Fleet inquiry DB persist omitted/table not ready]:", dbErr.message);
    }

    const adminEmail = process.env.ADMIN_EMAIL || "alekseitcheng@icloud.com";

    const inquirySummaryHtml = `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; background:#0B0F1A; color:#E8ECF2; border-radius:10px; overflow:hidden; border:1px solid #1C2029;">
        <div style="background: linear-gradient(135deg, #1C2E4A, #0F172A); padding:24px 28px; border-bottom:1px solid #252A35;">
          <span style="background:rgba(201,168,76,0.18); color:#DDBE66; border:1px solid rgba(201,168,76,0.3); font-size:11px; font-weight:700; padding:3px 10px; border-radius:4px; text-transform:uppercase; letter-spacing:1px;">New Fleet Inquiry</span>
          <h1 style="margin:10px 0 0; font-size:22px; color:#FFFFFF;">Turo / Fleet Management Request</h1>
          <p style="margin:6px 0 0; font-size:13px; color:#8B95A5;">From ${name} ${company ? `(${company})` : ""}</p>
        </div>
        <div style="padding:28px 32px;">
          <table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size:13px;">
            <tr><td style="padding:9px 0; border-bottom:1px solid #1C2029; color:#8B95A5; width:140px;">Contact Name</td><td style="padding:9px 0; border-bottom:1px solid #1C2029; font-weight:600; color:#FFFFFF;">${name}</td></tr>
            <tr><td style="padding:9px 0; border-bottom:1px solid #1C2029; color:#8B95A5;">Email</td><td style="padding:9px 0; border-bottom:1px solid #1C2029; color:#6BA3FF;"><a href="mailto:${email}" style="color:#6BA3FF;">${email}</a></td></tr>
            <tr><td style="padding:9px 0; border-bottom:1px solid #1C2029; color:#8B95A5;">Phone</td><td style="padding:9px 0; border-bottom:1px solid #1C2029; font-weight:600;"><a href="tel:${phone}" style="color:#E8ECF2;">${phone}</a></td></tr>
            ${company ? `<tr><td style="padding:9px 0; border-bottom:1px solid #1C2029; color:#8B95A5;">Fleet / Host Business</td><td style="padding:9px 0; border-bottom:1px solid #1C2029;">${company}</td></tr>` : ""}
            <tr><td style="padding:9px 0; border-bottom:1px solid #1C2029; color:#8B95A5;">Fleet Size</td><td style="padding:9px 0; border-bottom:1px solid #1C2029; font-weight:600; color:#C9A84C;">${fleetSize || "Not specified"} vehicles</td></tr>
            <tr><td style="padding:9px 0; border-bottom:1px solid #1C2029; color:#8B95A5;">Location / Area</td><td style="padding:9px 0; border-bottom:1px solid #1C2029;">${location || "San Francisco"}</td></tr>
            <tr><td style="padding:9px 0; border-bottom:1px solid #1C2029; color:#8B95A5;">Parking / Staging</td><td style="padding:9px 0; border-bottom:1px solid #1C2029;">${parkingType || "Not specified"}</td></tr>
            <tr><td style="padding:9px 0; border-bottom:1px solid #1C2029; color:#8B95A5;">Access Method</td><td style="padding:9px 0; border-bottom:1px solid #1C2029;">${accessMethod || "Lockbox / Digital"}</td></tr>
            <tr><td style="padding:9px 0; border-bottom:1px solid #1C2029; color:#8B95A5;">Service Interest</td><td style="padding:9px 0; border-bottom:1px solid #1C2029; color:#3DBB8A; font-weight:600;">${serviceType || "Standard Fleet Turnover"}</td></tr>
            ${vehicles ? `<tr><td style="padding:9px 0; border-bottom:1px solid #1C2029; color:#8B95A5;">Vehicles / Fleet List</td><td style="padding:9px 0; border-bottom:1px solid #1C2029;">${vehicles}</td></tr>` : ""}
            ${notes ? `<tr><td style="padding:9px 0; border-bottom:1px solid #1C2029; color:#8B95A5;">Notes / Schedule</td><td style="padding:9px 0; border-bottom:1px solid #1C2029;">${notes}</td></tr>` : ""}
          </table>
          <p style="font-size:12px; color:#5A6374; margin:0;">Inquiry received via BlueBay Auto Care Turo Fleet Portal.</p>
        </div>
      </div>
    `;

    // Try sending notification email if SMTP configured
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
        await transporter.sendMail({
          from: `"BlueBay Fleet Care" <${senderEmail}>`,
          to: adminEmail,
          replyTo: email,
          subject: `🚗 New Turo Fleet Inquiry: ${name} (${fleetSize || 1} cars)`,
          html: inquirySummaryHtml,
        });

        // Send confirmation email to host
        await transporter.sendMail({
          from: `"BlueBay Auto Care" <${senderEmail}>`,
          to: `"${name}" <${email}>`,
          replyTo: senderEmail,
          subject: "We received your Turo Fleet request — BlueBay Auto Care",
          html: `
            <div style="font-family: Arial, sans-serif; max-width:580px; margin:0 auto; background:#0B0F1A; color:#E8ECF2; border-radius:10px; overflow:hidden; border:1px solid #1C2029;">
              <div style="background:#111827; padding:24px 28px; text-align:center; border-bottom:1px solid #1F2937;">
                <h2 style="margin:0; font-size:20px; color:#FFFFFF;">BlueBay Auto Care</h2>
                <p style="margin:4px 0 0; font-size:13px; color:#DDBE66;">Turo & Carshare Fleet Turnover Service</p>
              </div>
              <div style="padding:28px 30px; font-size:14px; line-height:1.6; color:#D1D5DB;">
                <p style="margin:0 0 16px;">Hi ${name},</p>
                <p style="margin:0 0 16px;">Thank you for reaching out regarding fleet cleaning and management for your vehicles. We understand how crucial fast turnovers, spotless 5-star ratings, and reliable lockbox servicing are to your hosting business.</p>
                <p style="margin:0 0 20px;">Our fleet coordinator is reviewing your details and will get in touch within a few hours to confirm pricing, lockbox access, and your scheduling preferences.</p>
                <div style="background:#141A28; border:1px solid #1E293B; border-radius:8px; padding:16px; margin-bottom:20px;">
                  <strong style="color:#60A5FA; display:block; margin-bottom:6px;">Need an immediate same-day turnover?</strong>
                  <span style="font-size:13px; color:#94A3B8;">Call or text our fleet dispatch line directly at:</span>
                  <div style="margin-top:6px;"><a href="tel:+14157028468" style="color:#FBBF24; font-size:16px; font-weight:700; text-decoration:none;">(415) 702-8468</a></div>
                </div>
                <p style="margin:0; font-size:12px; color:#64748B;">BlueBay Auto Care / San Francisco, CA</p>
              </div>
            </div>
          `,
        });
      } catch (mailErr: any) {
        console.warn("[Fleet inquiry email notice]", mailErr.message);
      }
    } else {
      console.log("[Fleet Inquiry received (SMTP omitted)]:", { name, email, phone, fleetSize });
    }

    return NextResponse.json({
      ok: true,
      message: "Fleet inquiry submitted successfully",
    });
  } catch (err: any) {
    console.error("[Fleet inquiry error]", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
