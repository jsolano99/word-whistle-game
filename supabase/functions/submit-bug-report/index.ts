import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
      })
      .select()
      .single();

    if (error) {
      console.error("Database insert error:", error);
      throw error;
    }

    console.log("Bug report submitted:", data);

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