import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submission_id, id_image_path, selfie_image_path } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get signed URLs for images
    const { data: idUrlData } = await supabase.storage
      .from('kyc-documents')
      .createSignedUrl(id_image_path, 3600);
    
    const { data: selfieUrlData } = await supabase.storage
      .from('kyc-documents')
      .createSignedUrl(selfie_image_path, 3600);

    if (!idUrlData?.signedUrl || !selfieUrlData?.signedUrl) {
      throw new Error('Failed to generate signed URLs');
    }

    console.log('Analyzing images with AI...');

    // Call AI for OCR extraction
    const ocrResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                text: 'Extract the following information from this ID document: name, date of birth, ID number, document type (passport/driver license/national id), expiry date, and issuing country. Return the data in JSON format with keys: name, dob, id_number, document_type, expiry_date, country.'
              },
              {
                type: 'image_url',
                image_url: { url: idUrlData.signedUrl }
              }
            ]
          }
        ],
      }),
    });

    const ocrData = await ocrResponse.json();
    console.log('OCR Response:', ocrData);
    
    let extractedData = {};
    try {
      const ocrText = ocrData.choices?.[0]?.message?.content || '{}';
      const jsonMatch = ocrText.match(/\{[\s\S]*\}/);
      extractedData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (e) {
      console.error('Failed to parse OCR data:', e);
    }

    // Call AI for face similarity
    const similarityResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                text: 'Compare these two images and determine if they show the same person. First image is an ID photo, second is a selfie. Provide: 1) Similarity score (0-100), 2) Match confidence (high/medium/low), 3) Key facial features compared. Return as JSON with keys: similarity_score (number), match_confidence (string), features_analyzed (array of strings).'
              },
              {
                type: 'image_url',
                image_url: { url: idUrlData.signedUrl }
              },
              {
                type: 'image_url',
                image_url: { url: selfieUrlData.signedUrl }
              }
            ]
          }
        ],
      }),
    });

    const similarityData = await similarityResponse.json();
    console.log('Similarity Response:', similarityData);
    
    let faceMatchData = { similarity_score: 0, match_confidence: 'low', features_analyzed: [] };
    try {
      const simText = similarityData.choices?.[0]?.message?.content || '{}';
      const jsonMatch = simText.match(/\{[\s\S]*\}/);
      faceMatchData = jsonMatch ? JSON.parse(jsonMatch[0]) : faceMatchData;
    } catch (e) {
      console.error('Failed to parse similarity data:', e);
    }

    // Call AI for fraud detection
    const fraudResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                text: 'Analyze this ID document for fraud indicators. Check for: tampering signs, image quality, document authenticity, unusual patterns. Provide: 1) Fraud risk score (0-100, higher = more risk), 2) Risk level (low/medium/high), 3) Specific fraud indicators found, 4) AI recommendation (approve/review/reject). Return as JSON with keys: fraud_score (number), risk_level (string), fraud_indicators (array of strings), ai_recommendation (string).'
              },
              {
                type: 'image_url',
                image_url: { url: idUrlData.signedUrl }
              }
            ]
          }
        ],
      }),
    });

    const fraudData = await fraudResponse.json();
    console.log('Fraud Response:', fraudData);
    
    let fraudCheckData = { fraud_score: 50, risk_level: 'medium', fraud_indicators: [], ai_recommendation: 'review' };
    try {
      const fraudText = fraudData.choices?.[0]?.message?.content || '{}';
      const jsonMatch = fraudText.match(/\{[\s\S]*\}/);
      fraudCheckData = jsonMatch ? JSON.parse(jsonMatch[0]) : fraudCheckData;
    } catch (e) {
      console.error('Failed to parse fraud data:', e);
    }

    // Combine all AI results
    const aiScores = {
      similarity_score: faceMatchData.similarity_score || 0,
      match_confidence: faceMatchData.match_confidence || 'low',
      features_analyzed: faceMatchData.features_analyzed || [],
      fraud_score: fraudCheckData.fraud_score || 50,
      risk_level: fraudCheckData.risk_level || 'medium',
      fraud_indicators: fraudCheckData.fraud_indicators || [],
      ai_recommendation: fraudCheckData.ai_recommendation || 'review',
    };

    // Update submission with AI results
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        extracted_data: extractedData,
        ai_scores: aiScores,
      })
      .eq('id', submission_id);

    if (updateError) {
      console.error('Failed to update submission:', updateError);
      throw updateError;
    }

    console.log('Successfully updated submission with AI analysis');

    return new Response(
      JSON.stringify({ 
        success: true, 
        extracted_data: extractedData,
        ai_scores: aiScores 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in analyze-kyc function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
