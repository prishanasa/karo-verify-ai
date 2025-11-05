import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const requestSchema = z.object({
  submission_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  id_image_path: z.string()
    .max(500)
    .regex(/^[a-f0-9-]{36}\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i),
  selfie_image_path: z.string()
    .max(500)
    .regex(/^[a-f0-9-]{36}\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i)
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('KYC Analysis request received');

    // Validate request size
    const contentLength = req.headers.get('content-length');
    const MAX_REQUEST_SIZE = 10 * 1024; // 10KB
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Request too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract and verify JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id);

    // Parse and validate request body
    const body = await req.json();
    let validated;
    try {
      validated = requestSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid input parameters',
            details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }

    const { submission_id, id_image_path, selfie_image_path } = validated;

    // Fetch submission and verify ownership
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('user_id, id_image_url, selfie_image_url, updated_at')
      .eq('id', submission_id)
      .single();

    if (submissionError || !submission) {
      console.error('Submission not found:', submissionError);
      return new Response(
        JSON.stringify({ error: 'Submission not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify ownership
    if (submission.user_id !== user.id) {
      console.error('Unauthorized access attempt by user:', user.id, 'for submission:', submission_id);
      return new Response(
        JSON.stringify({ error: 'Unauthorized access to submission' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify paths match submission record (prevents path injection)
    if (submission.id_image_url !== id_image_path) {
      console.error('ID image path mismatch');
      return new Response(
        JSON.stringify({ error: 'ID image path mismatch' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (submission.selfie_image_url !== selfie_image_path) {
      console.error('Selfie path mismatch');
      return new Response(
        JSON.stringify({ error: 'Selfie path mismatch' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting - prevent re-analysis within 5 minutes (only if already analyzed)
    const { data: submissionFull } = await supabase
      .from('submissions')
      .select('ai_scores, updated_at')
      .eq('id', submission_id)
      .single();
    
    const hasBeenAnalyzed = submissionFull?.ai_scores && Object.keys(submissionFull.ai_scores).length > 0;
    
    if (hasBeenAnalyzed && submissionFull?.updated_at) {
      const lastUpdate = new Date(submissionFull.updated_at);
      const timeSinceUpdate = Date.now() - lastUpdate.getTime();
      
      if (timeSinceUpdate < 5 * 60 * 1000) {
        console.log('Rate limit exceeded for submission:', submission_id);
        return new Response(
          JSON.stringify({ error: 'Analysis already performed recently. Please wait before retrying.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Audit logging
    console.log({
      timestamp: new Date().toISOString(),
      function: 'analyze-kyc',
      user_id: user.id,
      submission_id: submission_id,
      action: 'analysis_started'
    });

    // Generate signed URLs for images
    const { data: idUrlData, error: idUrlError } = await supabase.storage
      .from('kyc-documents')
      .createSignedUrl(id_image_path, 3600);

    const { data: selfieUrlData, error: selfieUrlError } = await supabase.storage
      .from('kyc-documents')
      .createSignedUrl(selfie_image_path, 3600);

    if (idUrlError || selfieUrlError) {
      console.error('Error creating signed URLs:', idUrlError || selfieUrlError);
      return new Response(
        JSON.stringify({ error: 'Failed to access images' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const idImageUrl = idUrlData.signedUrl;
    const selfieImageUrl = selfieUrlData.signedUrl;

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const lovableApiUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';

    // Perform OCR on ID document
    console.log('Starting OCR analysis');
    const ocrResponse = await fetch(lovableApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all text from this ID document. Return the data as JSON with fields: name, date_of_birth, id_number, expiry_date, nationality. If any field is not visible, use null.'
              },
              {
                type: 'image_url',
                image_url: { url: idImageUrl }
              }
            ]
          }
        ]
      })
    });

    const ocrData = await ocrResponse.json();
    const ocrText = ocrData.choices[0].message.content;
    
    // Parse JSON from OCR response
    let extractedData;
    try {
      const jsonMatch = ocrText.match(/\{[\s\S]*\}/);
      extractedData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (e) {
      console.error('Failed to parse OCR JSON:', e);
      extractedData = { raw_text: ocrText };
    }

    // Perform face similarity analysis
    console.log('Starting face similarity analysis');
    const faceResponse = await fetch(lovableApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Compare the faces in these two images. The first is from an ID document, the second is a selfie. Also rate the image quality (0-100). Return JSON with: similarity_score (0-100), match (boolean), confidence_level (low/medium/high), image_quality_score (0-100), notes (any observations).'
              },
              {
                type: 'image_url',
                image_url: { url: idImageUrl }
              },
              {
                type: 'image_url',
                image_url: { url: selfieImageUrl }
              }
            ]
          }
        ]
      })
    });

    const faceData = await faceResponse.json();
    const faceText = faceData.choices[0].message.content;
    
    let faceAnalysis;
    try {
      const jsonMatch = faceText.match(/\{[\s\S]*\}/);
      faceAnalysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (e) {
      console.error('Failed to parse face analysis JSON:', e);
      faceAnalysis = { raw_response: faceText };
    }

    // Perform fraud detection
    console.log('Starting fraud detection analysis');
    const fraudResponse = await fetch(lovableApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this ID document for signs of tampering or fraud. Return JSON with: fraud_risk_score (0-100), is_fraudulent (boolean), fraud_indicators (array of strings), confidence (low/medium/high).'
              },
              {
                type: 'image_url',
                image_url: { url: idImageUrl }
              }
            ]
          }
        ]
      })
    });

    const fraudData = await fraudResponse.json();
    const fraudText = fraudData.choices[0].message.content;
    
    let fraudAnalysis;
    try {
      const jsonMatch = fraudText.match(/\{[\s\S]*\}/);
      fraudAnalysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (e) {
      console.error('Failed to parse fraud analysis JSON:', e);
      fraudAnalysis = { raw_response: fraudText };
    }

    // Combine all analysis results
    const imageQualityScore = faceAnalysis.image_quality_score || 75;
    const faceMatchConfidence = faceAnalysis.similarity_score || 0;
    const faceMatch = faceAnalysis.match || false;
    const fraudDetected = fraudAnalysis.is_fraudulent || false;
    const fraudReason = fraudDetected ? 
      (fraudAnalysis.fraud_indicators?.join(', ') || 'Suspicious document detected') : 
      null;

    const aiScores = {
      similarity_score: faceMatchConfidence,
      match_confidence: faceAnalysis.confidence_level || 'low',
      features_analyzed: faceAnalysis.notes || '',
      fraud_score: fraudAnalysis.fraud_risk_score || 0,
      risk_level: fraudAnalysis.confidence || 'medium',
      fraud_indicators: fraudAnalysis.fraud_indicators || [],
      ai_recommendation: fraudDetected ? 'reject' : 'review'
    };

    const frontendResponse = {
      image_quality_score: imageQualityScore,
      extracted_data: {
        name: extractedData.name || null,
        dob: extractedData.date_of_birth || null,
        id_number: extractedData.id_number || null
      },
      face_match: faceMatch,
      face_match_confidence: faceMatchConfidence,
      fraud_detected: fraudDetected,
      fraud_reason: fraudReason
    };

    // Update submission with analysis results
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        extracted_data: extractedData,
        ai_scores: aiScores,
        updated_at: new Date().toISOString()
      })
      .eq('id', submission_id);

    if (updateError) {
      console.error('Error updating submission:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to save analysis results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log({
      timestamp: new Date().toISOString(),
      function: 'analyze-kyc',
      user_id: user.id,
      submission_id: submission_id,
      action: 'analysis_completed',
      results: { 
        similarity_score: aiScores.similarity_score, 
        fraud_score: aiScores.fraud_score,
        face_match: faceMatch,
        fraud_detected: fraudDetected
      }
    });

    return new Response(
      JSON.stringify(frontendResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-kyc function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
