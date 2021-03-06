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
package org.primefaces.component.themeswitcher;

import java.io.IOException;

import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import org.primefaces.component.selectonemenu.SelectOneMenu;
import org.primefaces.component.selectonemenu.SelectOneMenuRenderer;
import org.primefaces.util.WidgetBuilder;

public class ThemeSwitcherRenderer extends SelectOneMenuRenderer {
 
    @Override
	protected void encodeScript(FacesContext context, SelectOneMenu menu) throws IOException {
		ResponseWriter writer = context.getResponseWriter();
        ThemeSwitcher ts = (ThemeSwitcher) menu;
        String clientId = ts.getClientId(context);
        WidgetBuilder wb = getWidgetBuilder(context);
        wb.widget("ThemeSwitcher", ts.resolveWidgetVar(), clientId, true)
                .attr("effect", ts.getEffect(), null)
                .attr("effectSpeed", ts.getEffectSpeed(), null);
        
        encodeClientBehaviors(context, menu, wb);
        
        startScript(writer, clientId);
        writer.write(wb.build());
        endScript(writer);
	}
}