# -*- coding: utf-8 -*-
"""
Created on Sat Mar 16 09:39:45 2024

@author: Waem2
"""

import tkinter as tk
from tkinter import*
window =tk.Tk()


lbl=Label(window,text='Hello Lable')
lbl.place(x=100,y=100)
btn=Button(window,text="This is Button widget")
btn.place(x=60,y=50)
btn=Entry(window)
btn.place(x=80,y=120)




window.title("Hello python")
window.geometry('800x300+250+100')
window.mainloop()



# -*- coding: utf-8 -*-
"""
Created on Sat Mar 23 10:48:21 2024

@author: Waem2
"""




import tkinter as tk
from tkinter import*
window =tk.Tk()


lbl=Label(window,text='Hello Lable')
lbl.place(x=100,y=100)
btn=Button(window,text="This is Button widget")
btn.place(x=60,y=50)
btn=Entry(window)
btn.place(x=80,y=120)





lb=Listbox(window,height=3,selectmode='multiple')
for num  in "data":
     lb.insert(END,num)
lb.place(x=250,y=150)


v0=IntVar()
v0.set(1)
r1=Radiobutton(window,text="male",variable=v0,value=1)
r2=Radiobutton(window,text="female",variable=v0,value=2)
r1.place(x=100,y=50)
r2.place(x=180,y=50)


v1=IntVar()
v2=IntVar()
c1=Checkbutton(window,text="Cricket",variable=v1)
c2=Checkbutton(window,text="Tennis",variable=v2)
c1.place(x=100,y=100)
c2.place(x=180,y=100)



window.title("Hello python")
window.geometry('800x300+250+100')
window.mainloop()


# -*- coding: utf-8 -*-
"""
Created on Sat Mar 23 11:00:03 2024

@author: Waem2
"""


from tkinter import*
window =Tk()


lbl=Label(window,text='first number')

lbl.place(x=100,y=100)

e1=Entry(window)
e1.place(x=80,y=120)




lb2=Label(window,text='second number')

lb2.place(x=100,y=160)

e2=Entry(window)
e2.place(x=80,y=200)
btn=Button(window,text="add")
btn.place(x=60,y=240)


btn=Button(window,text="sumbit")
btn.place(x=60,y=290)


lb3=Label(window,text='reslit')

lb3.place(x=100,y=320)

e3=Entry(window)
e3.place(x=80,y=400)

window.title("Hello waem")
window.geometry('800x300+250+100')
window.mainloop()



from tkinter import *
window =Tk()

def myfun():
    lbl['text']=str(  int(lbl['text'])+1)
btn=Button(window,text="اللهم صلي على النبي",command=myfun,font=('times',22))
btn.pack()


lbl=Label(window,text="0",font=('times',22))
lbl.pack()


window.title("Hello waem")
window.geometry('300x250+100+100')
window.mainloop()























