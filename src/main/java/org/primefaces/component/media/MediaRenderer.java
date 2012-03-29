/*
 * Copyright 2009-2012 Prime Teknoloji.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.primefaces.component.media;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import javax.faces.application.Resource;

import javax.faces.component.UIComponent;
import javax.faces.component.UIParameter;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;

import org.primefaces.component.media.player.MediaPlayer;
import org.primefaces.component.media.player.MediaPlayerFactory;
import org.primefaces.model.StreamedContent;
import org.primefaces.renderkit.CoreRenderer;
import org.primefaces.util.AgentUtils;
import org.primefaces.util.Constants;
import org.primefaces.util.HTML;

public class MediaRenderer extends CoreRenderer {

	@Override
	public void encodeEnd(FacesContext context, UIComponent component) throws IOException {
		Media media = (Media) component;
		MediaPlayer player = resolvePlayer(context, media);
		
		if(AgentUtils.isIE(context))
			encodeObjectTag(context, media, player);
		else
			encodeEmbedTag(context, media, player);
	}
	
	private void encodeObjectTag(FacesContext context, Media media, MediaPlayer player) throws IOException {
		ResponseWriter writer = context.getResponseWriter();
		String src = getMediaSrc(context, media);
		
		writer.startElement("object", media);
		writer.writeAttribute("classid", player.getClassId(), null);
		if(player.getCodebase() != null) {
			writer.writeAttribute("codebase", player.getCodebase(), null);
		}
		if(media.getStyleClass() != null) {
			writer.writeAttribute("class", media.getStyleClass(), null);
		}
		renderPassThruAttributes(context, media, HTML.MEDIA_ATTRS);
		
		encodeParam(writer, player.getSourceParam(), src, false);
	
		for(UIComponent child : media.getChildren()) {
			if(child instanceof UIParameter) {
				UIParameter param = (UIParameter) child;
				
				encodeParam(writer, param.getName(), param.getValue(), false);
			}
		}
		
		writer.endElement("object");
	}
	
	private void encodeEmbedTag(FacesContext context, Media media, MediaPlayer player) throws IOException {
		ResponseWriter writer = context.getResponseWriter();
		String src = getMediaSrc(context, media);
		
		writer.startElement("embed", media);
		writer.writeAttribute("pluginspage", player.getPlugingPage(), null);
		writer.writeAttribute("src", src, null);
		if(media.getStyleClass() != null) {
			writer.writeAttribute("class", media.getStyleClass(), null);
		}
		if(player.getType() != null) {
			writer.writeAttribute("type", player.getType(), null);
		}
		
		renderPassThruAttributes(context, media, HTML.MEDIA_ATTRS);
		
		for(UIComponent child : media.getChildren()) {
			if(child instanceof UIParameter) {
				UIParameter param = (UIParameter) child;
				
				encodeParam(writer, param.getName(), param.getValue(), true);
			}
		}
		
		writer.endElement("embed");
	}

	private void encodeParam(ResponseWriter writer, String name, Object value, boolean asAttribute) throws IOException {
		if(value == null)
			return;
		
		if(asAttribute) {
			writer.writeAttribute(name, value, null);
		} else {
			writer.startElement("param", null);
			writer.writeAttribute("name", name, null);
			writer.writeAttribute("value", value.toString(), null);
			writer.endElement("param");
		}
	}

	private MediaPlayer resolvePlayer(FacesContext context, Media media) {
		if(media.getPlayer() != null) {
			return MediaPlayerFactory.getPlayer(media.getPlayer());
		}
		else if(media.getValue() instanceof String){
			Map<String,MediaPlayer> players = MediaPlayerFactory.getPlayers();
			String[] tokens = ((String) media.getValue()).split("\\.");
			String type = tokens[tokens.length-1];
			
			for(MediaPlayer mp : players.values()) {
				if(mp.isAppropriatePlayer(type))
					return mp;
			}
		}
		
		throw new IllegalArgumentException("Cannot resolve mediaplayer for media component '" + media.getClientId(context) + "', cannot play source:" + media.getValue());
	}

	protected String getMediaSrc(FacesContext context, Media media) {
		String src = null;
		Object value = media.getValue();
        
        if(value == null) {
            src = "";
        }
        else {
            if(value instanceof StreamedContent) {
                StreamedContent streamedContent = (StreamedContent) value;
                Resource resource = context.getApplication().getResourceHandler().createResource("dynamiccontent", "primefaces", streamedContent.getContentType());
                String resourcePath = resource.getRequestPath();
                String rid = createUniqueContentId(context);
                StringBuilder builder = new StringBuilder(resourcePath);

                builder.append("&").append(Constants.DYNAMIC_CONTENT_PARAM).append("=").append(rid);

                for(UIComponent kid : media.getChildren()) {
                    if(kid instanceof UIParameter) {
                        UIParameter param = (UIParameter) kid;

                        builder.append("&").append(param.getName()).append("=").append(param.getValue());
                    }
                }

                src = builder.toString();

                context.getExternalContext().getSessionMap().put(rid, media.getValueExpression("value").getExpressionString());
            }
            else {
                src = getResourceURL(context, (String) value);
            }
        }

		return src;
	}
    
    protected String createUniqueContentId(FacesContext context) {
        Map<String,Object> session = context.getExternalContext().getSessionMap();
        
        String key = generateKey();
        
        while(session.containsKey(key)) {
            key = generateKey();
        }
        
        return key;
    }
    
    protected String generateKey() {
        StringBuilder builder = new StringBuilder();
        
        return builder.append(Constants.DYNAMIC_CONTENT_PARAM).append("_").append(UUID.randomUUID().toString()).toString();
    }
}