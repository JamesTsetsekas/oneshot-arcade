import{t as e}from"./shaderStore-D-XQlhUT.js";import{n as t,t as n}from"./imageProcessingFunctions-G8WWRV14.js";import{t as r}from"./helperFunctions-D89zo_74.js";var i=`imageProcessingPixelShader`,a=`varying vec2 vUV;uniform sampler2D textureSampler;
#include<imageProcessingDeclaration>
#include<helperFunctions>
#include<imageProcessingFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{vec4 result=texture2D(textureSampler,vUV);result.rgb=max(result.rgb,vec3(0.));
#ifdef IMAGEPROCESSING
#ifndef FROMLINEARSPACE
result.rgb=toLinearSpace(result.rgb);
#endif
result=applyImageProcessing(result);
#else
#ifdef FROMLINEARSPACE
result=applyImageProcessing(result);
#endif
#endif
gl_FragColor=result;}`;e.ShadersStore[i]||(e.ShadersStore[i]=a);var o=[t,r,n];for(let t of o)e.IncludesShadersStore[t.name]||(e.IncludesShadersStore[t.name]=t.shader);var s={name:i,shader:a};export{s as imageProcessingPixelShader};