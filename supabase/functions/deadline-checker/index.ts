import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get posts with deadlines that have passed but haven't been notified
    const { data: expiredPosts, error: fetchError } = await supabase
      .from("posts")
      .select("id, title, vote_deadline, created_at")
      .not("vote_deadline", "is", null)
      .lt("vote_deadline", new Date().toISOString())
      .order("vote_deadline", { ascending: false })
      .limit(50);

    if (fetchError) {
      console.error("Failed to fetch expired posts:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch expired posts" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!expiredPosts || expiredPosts.length === 0) {
      return new Response(
        JSON.stringify({ message: "No expired posts found", processed: 0 }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let processedCount = 0;
    const results = [];

    // Process each expired post
    for (const post of expiredPosts) {
      try {
        // Call the create_deadline_notifications function
        const { data: notificationResult, error: notificationError } =
          await supabase.rpc("create_deadline_notifications", {
            p_post_id: post.id,
            p_post_title: post.title,
          });

        if (notificationError) {
          console.error(
            `Failed to create notifications for post ${post.id}:`,
            notificationError,
          );
          results.push({
            postId: post.id,
            success: false,
            error: notificationError.message,
          });
        } else {
          const notificationCount = notificationResult || 0;
          console.log(
            `Created ${notificationCount} notifications for post ${post.id}`,
          );
          results.push({
            postId: post.id,
            success: true,
            notificationCount,
          });
          if (notificationCount > 0) {
            processedCount++;
          }
        }
      } catch (error) {
        console.error(`Error processing post ${post.id}:`, error);
        results.push({
          postId: post.id,
          success: false,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${processedCount} posts with deadline notifications`,
        processed: processedCount,
        total: expiredPosts.length,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Deadline checker error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
