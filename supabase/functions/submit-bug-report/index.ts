import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const formData = await req.formData();
    const description = formData.get("description") as string;
    const url = formData.get("url") as string;
    const userAgent = formData.get("userAgent") as string;
    const userEmail = formData.get("userEmail") as string | null;
    const screenshot = formData.get("screenshot") as File | null;

    let screenshotUrl = null;

    // Upload screenshot if provided
    if (screenshot) {
      const fileExt = screenshot.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("bug-screenshots")
        .upload(filePath, screenshot, {
          contentType: screenshot.type,
        });

      if (uploadError) {
        console.error("Screenshot upload error:", uploadError);
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from("bug-screenshots")
        .getPublicUrl(filePath);

      screenshotUrl = urlData.publicUrl;
    }

    // Insert bug report
    const { data, error } = await supabase
      .from("bug_reports")
      .insert({
        description,
        url,
        user_agent: userAgent,
        screenshot_url: screenshotUrl,
        user_email: userEmail,
      })
      .select()
      .single();

    if (error) {
      console.error("Database insert error:", error);
      throw error;
    }

    console.log("Bug report submitted:", data);

    // Send email notification to admin
    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    if (adminEmail) {
      try {
        const emailHtml = `
          <h2>New Bug Report Submitted</h2>
          <p><strong>Description:</strong> ${description}</p>
          <p><strong>URL:</strong> ${url}</p>
          <p><strong>User Agent:</strong> ${userAgent}</p>
          ${userEmail ? `<p><strong>User Email:</strong> ${userEmail}</p>` : ''}
          ${screenshotUrl ? `<p><strong>Screenshot:</strong> <a href="${screenshotUrl}">View Screenshot</a></p>` : ''}
          <p><strong>Submitted At:</strong> ${new Date(data.created_at).toLocaleString()}</p>
        `;

        await resend.emails.send({
          from: "Bug Reports <onboarding@resend.dev>",
          to: [adminEmail],
          subject: "New Bug Report Submitted",
          html: emailHtml,
        });

        console.log("Email notification sent to admin");

        // Send thank you email to user if they provided their email
        if (userEmail) {
          await resend.emails.send({
            from: "Bug Reports <onboarding@resend.dev>",
            to: [userEmail],
            subject: "Thank you for your bug report",
            html: `
              <h2>Thank You!</h2>
              <p>We appreciate you taking the time to report this issue. Our team will review it shortly.</p>
              <p><strong>Your Report:</strong></p>
              <p>${description}</p>
            `,
          });
          console.log("Thank you email sent to user");
        }
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in submit-bug-report function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});